import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabaseClient';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// Required for Expo AuthSession to intercept the redirect
WebBrowser.maybeCompleteAuthSession();

const PROFILE_CACHE_KEY = 'user_profile_cache';

interface AuthContextProps {
  isLoading: boolean;
  error: string | null;
  loginSuccess: boolean;
  signupSuccess: boolean;
  updateProfileSuccess: boolean;
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  userProfile: any | null;
  login: (identifier: string, pass: string) => Promise<void>;
  register: (email: string, name: string, pass: string, mobile: string) => Promise<'signed_in' | 'confirmation_required' | false>;
  verifySignupOtp: (email: string, token: string) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  finalizeWebAuthCallback: (callbackUrl: string) => Promise<void>;
  ensureAuthenticatedUser: () => Promise<any | null>;
  signInWithGoogleNative: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  checkUsernameAvailability: (username: string) => Promise<{ available: boolean; suggestions: string[] }>;
  updateOnboardingProfile: (data: { username?: string; language?: string; topics?: string[]; avatarUrl?: string; onboarding_complete?: boolean }) => Promise<void>;
  uploadProfileImage: (imageUri: string) => Promise<string>;
  updateProfile: (username: string, bio: string) => Promise<void>;
  clearState: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [updateProfileSuccess, setUpdateProfileSuccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);

  // Guard: prevents onAuthStateChange from racing with manual Google OAuth flow
  const isHandlingOAuthRef = useRef(false);
  // Guard: prevents onAuthStateChange from racing with registration flow
  const isRegisteringRef = useRef(false);
  // Deduplicate concurrent ensureUserRow calls during boot / auth events
  const ensureInFlightRef = useRef<Record<string, Promise<any>>>({});

  // ─── Cache Helpers ───
  const saveProfileToCache = async (profile: any) => {
    try {
      if (profile) {
        await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
      } else {
        await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
      }
    } catch (e) {
      console.warn('[AUTH] Cache save error:', e);
    }
  };

  const loadProfileFromCache = async () => {
    try {
      const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      console.warn('[AUTH] Cache load error:', e);
      return null;
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web') return;
    // ─── Native Google Sign-In Configuration ───
    // This allows the "Choose an account" screen to show "OMH" instead of the Supabase URL.
    // Replace the webClientId with your actual ID from Google Cloud Console.
    GoogleSignin.configure({
      webClientId: '71358147237-gvakjq7v747jacqmsr5f5vk53ha83ode.apps.googleusercontent.com',
      offlineAccess: true,
    });
  }, []);

  // ─── Fetch profile from User table ───
  const fetchProfile = async (userId: string, skipRetries = false) => {
    try {
      let profileData = null;
      const maxAttempts = skipRetries ? 1 : 5;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const { data, error: profileError } = await supabase
          .from('User')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (profileError) {
          console.warn('[AUTH] Profile fetch error:', profileError.message);
          throw profileError;
        }

        if (data) {
          profileData = data;
          break;
        }

        if (!skipRetries) {
          // Wait longer on each retry to give the DB trigger time
          await new Promise(resolve => setTimeout(resolve, 800 * (attempt + 1)));
        }
      }

      if (profileData) {
        console.warn('[AUTH] Profile loaded:', profileData.email, '| onboarding_complete:', profileData.onboarding_complete);
        return profileData;
      } else {
        console.warn('[AUTH] No profile found after retries for user:', userId);
        return null;
      }
    } catch (err: any) {
      console.error('[AUTH] fetchProfile error:', err);
      return null;
    }
  };

  const checkOnboardingStatus = (profile: any): boolean => {
    if (!profile) return true;
    return !profile.onboarding_complete;
  };

  // ─── Set all auth state at once (avoids race conditions) ───
  const setAuthState = (profile: any, authenticated: boolean) => {
    const onboarding = checkOnboardingStatus(profile);
    console.warn('[AUTH] Setting state → authenticated:', authenticated, '| needsOnboarding:', onboarding);
    setUserProfile(profile);
    setNeedsOnboarding(onboarding);
    setIsAuthenticated(authenticated);
    saveProfileToCache(profile);
  };

  // ─── Ensure a citizen User row exists for newly created OAuth / Email users ───
  const ensureUserRow = async (
    authUser: any,
    extra?: { fullName?: string; mobile?: string }
  ) => {
    const key = authUser?.id;
    if (key && ensureInFlightRef.current[key] && !extra?.fullName && !extra?.mobile) {
      return ensureInFlightRef.current[key];
    }

    const run = async () => {
    // 1. Prefer authoritative SECURITY DEFINER RPC (handles triggers, RLS & email linking atomically)
    try {
      const { data: rpcProfile, error: rpcErr } = await supabase.rpc('ensure_citizen_profile');
      if (!rpcErr && rpcProfile?.id) {
        const extraUpdates: Record<string, any> = {};
        if (extra?.fullName?.trim() && !rpcProfile.channel_name) {
          extraUpdates.channel_name = extra.fullName.trim();
        }
        if (extra?.mobile?.trim() && !rpcProfile.phone) {
          extraUpdates.phone = extra.mobile.trim();
        }
        if (Object.keys(extraUpdates).length > 0) {
          extraUpdates.updatedAt = new Date().toISOString();
          const { data: updated } = await supabase
            .from('User')
            .update(extraUpdates)
            .eq('id', authUser.id)
            .select()
            .maybeSingle();
          return updated || { ...rpcProfile, ...extraUpdates };
        }
        return rpcProfile;
      }
    } catch (_) {
      // Fallback to direct table lookup/upsert if RPC is not yet deployed
    }

    const existing = await fetchProfile(authUser.id, true);
    if (existing) {
      const updates: Record<string, any> = {};
      const displayName =
        extra?.fullName?.trim() ||
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name;
      if (displayName && !existing.channel_name) {
        updates.channel_name = displayName;
      }
      if (extra?.mobile?.trim() && !existing.phone) {
        updates.phone = extra.mobile.trim();
      }
      if (!existing.avatarUrl && (authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture)) {
        updates.avatarUrl = authUser.user_metadata.avatar_url || authUser.user_metadata.picture;
      }
      if (!existing.account_status) {
        updates.account_status = 'active';
      }
      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date().toISOString();
        const { data: updatedRow } = await supabase
          .from('User')
          .update(updates)
          .eq('id', authUser.id)
          .select()
          .maybeSingle();
        return updatedRow || { ...existing, ...updates };
      }
      return existing;
    }

    const now = new Date().toISOString();
    const displayName =
      extra?.fullName?.trim() ||
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      null;
    const avatar = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null;
    const insertPayload: Record<string, any> = {
      id: authUser.id,
      email: (authUser.email || '').toLowerCase(),
      password: 'oauth_managed',
      role: 'CITIZEN',
      account_status: 'active',
      onboarding_complete: false,
      createdAt: now,
      updatedAt: now,
    };
    if (displayName) insertPayload.channel_name = displayName;
    if (extra?.mobile?.trim()) insertPayload.phone = extra.mobile.trim();
    if (avatar) insertPayload.avatarUrl = avatar;

    const { data: inserted, error: upsertErr } = await supabase
      .from('User')
      .upsert(insertPayload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (upsertErr) {
      console.warn('[AUTH] ensureUserRow upsert error:', upsertErr.message);
    }

    return inserted || (await fetchProfile(authUser.id, true)) || insertPayload;
    };

    if (!key || extra?.fullName || extra?.mobile) {
      return run();
    }
    const promise = run().finally(() => {
      delete ensureInFlightRef.current[key];
    });
    ensureInFlightRef.current[key] = promise;
    return promise;
  };

  // ─── Reconcile authenticated session on-demand (prevents stale Login Required prompts) ───
  const ensureAuthenticatedUser = async () => {
    if (userProfile?.id && isAuthenticated) {
      return userProfile;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        if (userProfile || isAuthenticated) {
          setAuthState(null, false);
        }
        return null;
      }

      if (userProfile?.id === session.user.id) {
        setIsAuthenticated(true);
        return userProfile;
      }

      const profile = await ensureUserRow(session.user);
      if (profile?.role === 'CREATOR' || profile?.role === 'ADMIN') {
        await supabase.auth.signOut();
        setAuthState(null, false);
        return null;
      }

      const resolved = profile || {
        id: session.user.id,
        email: session.user.email || '',
        role: 'CITIZEN',
        onboarding_complete: false,
      };
      setAuthState(resolved, true);
      return resolved;
    } catch (e) {
      console.warn('[AUTH] ensureAuthenticatedUser error:', e);
      return userProfile?.id ? userProfile : null;
    }
  };

  // ─── Check for existing session on mount ───
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Skip restoring stale cache when handling an active web OAuth callback URL
        const onWebCallback =
          Platform.OS === 'web' &&
          typeof window !== 'undefined' &&
          (window.location.pathname.includes('/auth/callback') ||
            window.location.hash.includes('access_token=') ||
            window.location.search.includes('code='));

        const cachedProfile = onWebCallback ? null : await loadProfileFromCache();
        if (cachedProfile) {
          console.warn('[AUTH] Loading profile from cache...');
          setAuthState(cachedProfile, true);
          setInitializing(false);
        }

        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          console.warn('[AUTH] Existing session found for:', session.user.email);
          const profile = await ensureUserRow(session.user);

          if (profile) {
            if (profile.role === 'CREATOR' || profile.role === 'ADMIN') {
              console.warn('[AUTH] Non-citizen role, signing out');
              await supabase.auth.signOut();
            } else {
              setAuthState(profile, true);
            }
          }
        } else {
          console.warn('[AUTH] No existing session');
          if (cachedProfile) setAuthState(null, false);
        }
      } catch (e) {
        console.error('[AUTH] Session check failed:', e);
      } finally {
        setInitializing(false);
      }
    };

    checkSession();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.warn('[AUTH] onAuthStateChange:', event);

      // Skip if we're currently handling Google OAuth or Registration manually
      if (isHandlingOAuthRef.current || isRegisteringRef.current) {
        console.warn('[AUTH] Skipping onAuthStateChange — manual flow in progress');
        return;
      }

      if (event === 'SIGNED_OUT') {
        setAuthState(null, false);
      } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') && session?.user) {
        const profile = await ensureUserRow(session.user);
        if (profile?.role === 'CREATOR' || profile?.role === 'ADMIN') {
          await supabase.auth.signOut();
          return;
        }
        setAuthState(profile, true);
      }
    });

    // Web cross-tab & window focus realtime auth sync
    const syncCrossTabSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await ensureUserRow(session.user);
          if (profile?.role !== 'CREATOR' && profile?.role !== 'ADMIN') {
            setAuthState(profile, true);
          }
        } else {
          setAuthState(null, false);
        }
      } catch (_) {}
    };

    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key.includes('auth-token') || e.key === PROFILE_CACHE_KEY) {
        void syncCrossTabSession();
      }
    };
    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void syncCrossTabSession();
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      subscription.unsubscribe();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage);
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
  }, []);

  // ─── Realtime User profile updates ───
  useEffect(() => {
    if (!userProfile?.id) return;
    const channel = supabase
      .channel(`user-profile-realtime-${userProfile.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'User', filter: `id=eq.${userProfile.id}` },
        (payload) => {
          if (payload?.new) {
            setAuthState(payload.new, true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id]);


  // ─── Email/Mobile/Username Password Login ───
  const login = async (identifier: string, pass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      let loginEmail = identifier.trim().toLowerCase();

      // If identifier contains '@', it's already an email
      if (!loginEmail.includes('@')) {
        // First try looking up by phone number
        const { data: phoneData } = await supabase
          .from('User')
          .select('email')
          .eq('phone', identifier.trim())
          .maybeSingle();

        if (phoneData && phoneData.email) {
          loginEmail = phoneData.email;
          console.warn('[AUTH] Found email for phone:', loginEmail);
        } else {
          // Then try looking up by username
          const { data: usernameData } = await supabase
            .from('User')
            .select('email')
            .eq('username', loginEmail)
            .maybeSingle();

          if (usernameData && usernameData.email) {
            loginEmail = usernameData.email;
            console.warn('[AUTH] Found email for username:', loginEmail);
          } else {
            setError('No account found with this email, mobile number, or username.');
            setIsLoading(false);
            return;
          }
        }
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: pass,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (!authData.user) {
        setError('Login failed.');
        return;
      }

      const profile = await fetchProfile(authData.user.id);

      if (profile?.role === 'CREATOR' || profile?.role === 'ADMIN') {
        setError('This app is for citizens. Please use the appropriate dashboard for your role.');
        await supabase.auth.signOut();
        return;
      }

      setAuthState(profile || { id: authData.user.id, email: loginEmail, onboarding_complete: false }, true);
      setLoginSuccess(true);
    } catch (e: any) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Direct Registration ───
  const register = async (
    email: string,
    name: string,
    pass: string,
    mobile: string
  ): Promise<'signed_in' | 'confirmation_required' | false> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanMobile = mobile.trim();

    if (cleanName.length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (pass.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }

    setIsLoading(true);
    setError(null);
    isRegisteringRef.current = true;
    try {
      const { data: existingEmail } = await supabase
        .from('User')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingEmail) {
        setError('Email ID already exists. Please login instead.');
        return false;
      }

      if (cleanMobile) {
        const { data: existingPhone } = await supabase
          .from('User')
          .select('id')
          .eq('phone', cleanMobile)
          .maybeSingle();

        if (existingPhone) {
          setError('Mobile number already exists. Please login instead.');
          return false;
        }
      }

      const uniqueUsername = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const emailRedirectTo =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          ...(emailRedirectTo ? { emailRedirectTo } : {}),
          data: {
            full_name: cleanName,
            phone: cleanMobile || undefined,
            role: 'CITIZEN',
            username: uniqueUsername,
          },
        },
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('already registered')) {
          setError('Email ID already exists. Please login instead.');
        } else {
          setError(authError.message);
        }
        return false;
      }

      if (authData.user) {
        if (!authData.session) {
          // Email verification / OTP required before session becomes active
          setSignupSuccess(true);
          return 'confirmation_required';
        }

        await new Promise(resolve => setTimeout(resolve, 600));
        const profile = await ensureUserRow(authData.user, {
          fullName: cleanName,
          mobile: cleanMobile,
        });
        setAuthState(profile, true);
        setSignupSuccess(true);
        return 'signed_in';
      }

      return false;
    } catch (e: any) {
      console.error('[AUTH] Registration error:', e);
      const raw = String(e?.message || '').toLowerCase();
      if (raw.includes('already registered') || raw.includes('already exists')) {
        setError('An account with this email already exists. Please sign in instead.');
      } else {
        setError('Registration could not be completed. Please check your details and try again.');
      }
      return false;
    } finally {
      setIsLoading(false);
      isRegisteringRef.current = false;
    }
  };

  // ─── Password Reset Email ───
  const sendPasswordReset = async (email: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return false;
    }
    setIsLoading(true);
    setError(null);
    try {
      const redirectTo =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : undefined;
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        ...(redirectTo ? { redirectTo } : {}),
      });
      if (resetErr) throw resetErr;
      return true;
    } catch (e: any) {
      console.error('[AUTH] Password reset error:', e);
      setError('Could not send password reset email right now. Please try again later.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Verify OTP ───
  const verifySignupOtp = async (email: string, token: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup'
      });

      if (verifyError) {
        setError(verifyError.message);
        return false;
      }

      if (data.session || data.user) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const profile = await fetchProfile(data.user!.id);
        setAuthState(profile || { id: data.user!.id, email, onboarding_complete: false }, true);
        setSignupSuccess(true);
        return true;
      }
      return false;
    } catch (e: any) {
      setError('OTP Verification failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Native Google Sign-In (Fixes Branding Issue) ───
  const signInWithGoogleNative = async () => {
    if (Platform.OS === 'web') {
      return signInWithGoogle();
    }
    if (isHandlingOAuthRef.current) return;
    setIsLoading(true);
    setError(null);
    isHandlingOAuthRef.current = true;

    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        throw new Error('Google Sign-In failed: No ID token received');
      }

      console.warn('[GOOGLE AUTH] Native token received, signing in to Supabase...');
      const { data, error: authError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (authError) throw authError;

      if (data.session) {
        const profile = await fetchProfile(data.session.user.id);
        setAuthState(profile || { id: data.session.user.id, email: data.session.user.email!, onboarding_complete: false }, true);
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.warn('[GOOGLE AUTH] User cancelled native sign-in');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.warn('[GOOGLE AUTH] Sign-in already in progress');
      } else {
        console.error('[GOOGLE AUTH] Native Error:', error);
        setError('Google Sign-In could not be completed. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => { isHandlingOAuthRef.current = false; }, 1000);
    }
  };

  // ─── Google OAuth Sign-In (Web direct redirect + Native AuthSession) ───
  const signInWithGoogle = async () => {
    if (isHandlingOAuthRef.current) {
      console.warn('[GOOGLE AUTH] Already in progress, ignoring');
      return;
    }

    setIsLoading(true);
    setError(null);
    isHandlingOAuthRef.current = true;

    // On Web, perform a standard full-page OAuth redirect (no popup / no antigravity:// fallback)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const redirectTo = `${window.location.origin}/auth/callback`;
        console.warn('[GOOGLE AUTH] Web redirectTo:', redirectTo);
        const { error: authError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
            queryParams: {
              access_type: 'offline',
              prompt: 'select_account',
            },
          },
        });
        if (authError) throw authError;
      } catch (e: any) {
        console.error('[GOOGLE AUTH] Web Error:', e);
        setError('Google Sign-In could not be completed. Please try again.');
        setIsLoading(false);
        isHandlingOAuthRef.current = false;
      }
      return;
    }

    // Deep link listener subscription (cleaned up in finally)
    let linkSubscription: { remove: () => void } | null = null;

    try {
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'antigravity',
        path: 'auth/callback',
      });

      console.warn('[GOOGLE AUTH] ── Starting OAuth Flow ──');
      console.warn('[GOOGLE AUTH] Redirect URL:', redirectUrl);
      console.warn('[GOOGLE AUTH] Platform:', Platform.OS);

      // ── Step 2: Set up deep link listener BEFORE opening browser ──
      // This catches the redirect even when Chrome Custom Tab misses it
      // (Chrome can't intercept custom scheme redirects like antigravity://)
      let deepLinkResolve: ((url: string) => void) | null = null;
      const deepLinkPromise = new Promise<string>((resolve) => {
        deepLinkResolve = resolve;
      });

      const Linking = require('expo-linking');
      linkSubscription = Linking.addEventListener('url', (event: { url: string }) => {
        console.warn('[GOOGLE AUTH] 📥 Deep link received:', event.url.substring(0, 120));
        if (
          event.url.includes('auth/callback') ||
          event.url.includes('access_token') ||
          event.url.includes('refresh_token') ||
          event.url.includes('code=')
        ) {
          deepLinkResolve?.(event.url);
        }
      });

      // Also check initial URL just in case it arrived right before we listened
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl && (initialUrl.includes('access_token') || initialUrl.includes('code='))) {
        console.warn('[GOOGLE AUTH] Initial URL contained tokens, using it:', initialUrl.substring(0, 120));
        deepLinkResolve?.(initialUrl);
      }


      // ── Step 3: Request OAuth URL from Supabase ──
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (authError) {
        console.error('[GOOGLE AUTH] Supabase error:', authError.message);
        throw new Error(`Failed to start Google sign-in: ${authError.message}`);
      }
      if (!data?.url) {
        throw new Error('No authentication URL received. Please try again.');
      }

      console.warn('[GOOGLE AUTH] Opening browser...');

      // ── Step 4: Open browser for OAuth ──
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl,
        { showInRecents: true }
      );

      console.warn('[GOOGLE AUTH] Browser result:', result.type);

      // ── Step 5: Determine the auth callback URL ──
      let urlToProcess: string | null = null;

      if (result.type === 'success' && result.url) {
        // Best case: Custom Tab intercepted the redirect
        urlToProcess = result.url;
        console.warn('[GOOGLE AUTH] ✅ URL from browser');

      } else if (result.type === 'dismiss' || result.type === 'cancel') {
        // Custom Tab didn't intercept — check deep link fallback
        console.warn('[GOOGLE AUTH] Browser dismissed or cancelled, waiting for deep link fallback (5s)...');

        // Wait up to 5 seconds for the deep link to arrive via Android Intent
        // Sometimes the OS is slow to deliver the intent after closing the browser
        const raceResult = await Promise.race([
          deepLinkPromise.then((url) => ({ source: 'deeplink' as const, url })),
          new Promise<{ source: 'timeout' }>((r) =>
            setTimeout(() => r({ source: 'timeout' }), 5000)
          ),
        ]);

        if (raceResult.source === 'deeplink') {
          urlToProcess = raceResult.url;
          console.warn('[GOOGLE AUTH] ✅ URL from deep link fallback');
        } else {
          // No callback received at all — user genuinely cancelled
          console.warn('[GOOGLE AUTH] No callback received (timeout) — user cancelled');
          // In some Android versions, if the browser is closed manually, it's a true cancel.
          // Don't show a blocking error pop-up for manual cancellations to avoid annoying the user.
          return; // Silent return
        }
      }

      if (!urlToProcess) {
        console.warn('[GOOGLE AUTH] No URL to process');
        return;
      }

      console.warn('[GOOGLE AUTH] Processing callback URL (first 120 chars):', urlToProcess.substring(0, 120));

      // ── Step 6: Extract tokens or exchange code ──
      await processAuthCallbackUrl(urlToProcess);

    } catch (e: any) {
      console.error('[GOOGLE AUTH] Error:', e?.message || e);
      const msg = e?.message || '';
      if (msg.includes('network') || msg.includes('Network') || msg.includes('AbortError')) {
        setError('Network error during sign-in. Please check your connection.');
      } else if (msg.includes('cancel') || msg.includes('dismiss')) {
        return; // Silent
      } else {
        setError(msg || 'Google Sign-In failed. Please try again.');
      }
    } finally {
      // Clean up deep link listener
      if (linkSubscription) {
        try { linkSubscription.remove(); } catch (_) { }
      }
      setIsLoading(false);
      setTimeout(() => { isHandlingOAuthRef.current = false; }, 1500);
    }
  };

  // ─── Finalize Web OAuth Callback (/auth/callback) ───
  const finalizeWebAuthCallback = async (callbackUrl: string) => {
    isHandlingOAuthRef.current = true;
    try {
      let { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        const hasCode = /[?&#]code=([^&#]+)/.test(callbackUrl);
        if (hasCode) {
          try {
            const { data: exchanged, error: exErr } = await supabase.auth.exchangeCodeForSession(callbackUrl);
            if (exErr) throw exErr;
            session = exchanged.session;
          } catch (exErr) {
            // detectSessionInUrl may have completed exchange concurrently; re-check getSession
            await new Promise((r) => setTimeout(r, 300));
            const recheck = await supabase.auth.getSession();
            if (recheck.data?.session) {
              session = recheck.data.session;
            } else {
              throw exErr;
            }
          }
        } else {
          const { accessToken, refreshToken } = extractTokensFromUrl(callbackUrl);
          if (accessToken && refreshToken) {
            const { data: setRes, error: setErr } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (setErr) throw setErr;
            session = setRes.session;
          }
        }
      }

      if (!session?.user) {
        // Last short wait in case Supabase detectSessionInUrl promise is still resolving
        await new Promise((r) => setTimeout(r, 400));
        const finalCheck = await supabase.auth.getSession();
        session = finalCheck.data?.session ?? null;
      }

      if (!session?.user) {
        throw new Error('Authentication session could not be verified.');
      }

      const profile = await ensureUserRow(session.user);
      if (profile?.role === 'CREATOR' || profile?.role === 'ADMIN') {
        await supabase.auth.signOut();
        throw new Error('This portal is for readers. Please use Creator Studio or Admin Control Center.');
      }

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.history.replaceState(null, '', '/auth/callback');
      }

      setAuthState(profile, true);
      setLoginSuccess(true);
    } finally {
      isHandlingOAuthRef.current = false;
    }
  };

  /**
   * Processes an OAuth callback URL — handles both implicit flow (tokens in hash)
   * and PKCE flow (authorization code in query params).
   */
  const processAuthCallbackUrl = async (url: string) => {
    // ── Try implicit flow: tokens in URL fragment ──
    const { accessToken, refreshToken } = extractTokensFromUrl(url);

    if (accessToken && refreshToken) {
      console.warn('[GOOGLE AUTH] Setting session from tokens...');

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) throw new Error('Failed to set session: ' + sessionError.message);
      if (!sessionData?.user) throw new Error('No user data received from session.');

      // Verify session was persisted
      const { data: verifyData } = await supabase.auth.getSession();
      if (!verifyData?.session) throw new Error('Session failed to persist.');

      console.warn('[GOOGLE AUTH] ✅ Session verified for:', sessionData.user.email);
      await new Promise((r) => setTimeout(r, 2000)); // Wait for DB trigger
      const profile = await fetchProfile(sessionData.user.id);

      // Check if user is newly created (within last 60 seconds)
      const isNewUser = sessionData.user.created_at ? (new Date().getTime() - new Date(sessionData.user.created_at).getTime() < 60000) : false;
      console.warn('[GOOGLE AUTH] isNewUser (Implicit):', isNewUser);

      setAuthState(
        profile ? { ...profile, onboarding_complete: isNewUser ? false : profile.onboarding_complete } :
          { id: sessionData.user.id, email: sessionData.user.email, onboarding_complete: false },
        true
      );
      setLoginSuccess(true);
      console.warn('[GOOGLE AUTH] ✅ Auth complete!');
      try { WebBrowser.dismissBrowser(); } catch (_) { }
      return;
    }

    // ── Try PKCE flow: authorization code in query params ──
    const codeMatch = url.match(/[?&#]code=([^&#]+)/);
    if (codeMatch) {
      console.warn('[GOOGLE AUTH] Exchanging authorization code...');

      const { data: sessionData, error: sessionError } =
        await supabase.auth.exchangeCodeForSession(url);

      if (sessionError) throw new Error('Code exchange failed: ' + sessionError.message);

      if (sessionData?.session?.user) {
        console.warn('[GOOGLE AUTH] ✅ Code exchange successful:', sessionData.session.user.email);
        await new Promise((r) => setTimeout(r, 2000));
        const profile = await fetchProfile(sessionData.session.user.id);

        // Check if user is newly created (within last 60 seconds)
        const isNewUser = sessionData.session.user.created_at ? (new Date().getTime() - new Date(sessionData.session.user.created_at).getTime() < 60000) : false;
        console.warn('[GOOGLE AUTH] isNewUser (PKCE):', isNewUser);

        setAuthState(
          profile ? { ...profile, onboarding_complete: isNewUser ? false : profile.onboarding_complete } :
            {
              id: sessionData.session.user.id,
              email: sessionData.session.user.email,
              onboarding_complete: false,
            },
          true
        );
        setLoginSuccess(true);
        try { WebBrowser.dismissBrowser(); } catch (_) { }
        return;
      }
    }

    // ── Neither tokens nor code found ──
    console.error('[GOOGLE AUTH] ❌ No credentials in URL:', url);
    throw new Error('Authentication failed — no credentials received. Please try again.');
  };

  /**
   * Extracts access_token and refresh_token from a callback URL.
   * Handles both hash fragments (#access_token=...) and query strings (?access_token=...).
   */
  const extractTokensFromUrl = (url: string): { accessToken: string | null; refreshToken: string | null } => {
    try {
      // Try hash fragment first (Supabase implicit flow default)
      let dataString = '';

      if (url.includes('#')) {
        dataString = url.split('#')[1] || '';
      }

      // Fallback to query string
      if (!dataString && url.includes('?')) {
        const queryPart = url.split('?').slice(1).join('?');
        dataString = queryPart;
      }

      if (!dataString) {
        console.warn('[GOOGLE AUTH] No hash or query params in URL');
        return { accessToken: null, refreshToken: null };
      }

      const params = new URLSearchParams(dataString);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      console.warn('[GOOGLE AUTH] Token extraction → access:', !!accessToken, '| refresh:', !!refreshToken);

      if (accessToken && !refreshToken) {
        console.warn('[GOOGLE AUTH] ⚠️ Access token found but no refresh token — session may not persist');
      }

      return { accessToken, refreshToken };
    } catch (e) {
      console.error('[GOOGLE AUTH] Token parsing error:', e);
      return { accessToken: null, refreshToken: null };
    }
  };

  // ─── Username Availability Check ───
  const checkUsernameAvailability = async (username: string): Promise<{ available: boolean; suggestions: string[] }> => {
    try {
      const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (cleanUsername.length < 3) return { available: false, suggestions: [] };

      // Check availability via SECURITY DEFINER RPC across both User and creator_requests
      const { data: isAvailable, error: rpcError } = await supabase
        .rpc('check_username_available', { p_username: cleanUsername });

      if (rpcError) throw rpcError;

      if (isAvailable) return { available: true, suggestions: [] };

      const base = cleanUsername.replace(/[0-9]+$/, '');
      const suggestions = [
        `${base}${Math.floor(Math.random() * 999)}`,
        `${base}_official`,
        `the_${base}`
      ];
      return { available: false, suggestions };
    } catch (e) {
      return { available: false, suggestions: [] };
    }
  };

  // ─── Upload Profile Image ───
  const uploadProfileImage = async (imageUri: string): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || userProfile?.id;
    if (!userId) throw new Error('Not authenticated');
    if (!session?.access_token) throw new Error('No access token');

    const fileExt = imageUri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    const fileName = `profile-images/${userId}/avatar_${Date.now()}.${fileExt}`;
    const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;
    const supabaseUrl = SUPABASE_URL;
    const supabaseKey = SUPABASE_ANON_KEY;

    try {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const blob = await (await fetch(imageUri)).blob();
        formData.append('file', blob, `avatar.${fileExt}`);
      } else {
        formData.append('file', {
          uri: imageUri,
          name: `avatar.${fileExt}`,
          type: contentType,
        } as any);
      }

      console.warn('[UPLOAD] Uploading to:', `${supabaseUrl}/storage/v1/object/media/${fileName}`);

      const uploadResponse = await fetch(
        `${supabaseUrl}/storage/v1/object/media/${fileName}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': supabaseKey,
            'x-upsert': 'true',
            // Do NOT set Content-Type — fetch sets it automatically with boundary for FormData
          },
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('[UPLOAD] Server error:', uploadResponse.status, errorText);
        throw new Error(`Upload failed (${uploadResponse.status}): ${errorText}`);
      }

      // Get the public URL
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(fileName);
      console.warn('[UPLOAD] ✅ Profile image uploaded:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (e: any) {
      console.error('[UPLOAD] Profile image upload error:', e);
      throw e;
    }
  };

  // ─── Update Profile During Onboarding ───
  const updateOnboardingProfile = async (data: {
    username?: string;
    language?: string;
    topics?: string[];
    avatarUrl?: string;
    onboarding_complete?: boolean;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || userProfile?.id;

      if (!userId) throw new Error('Not authenticated. Please try logging in again.');

      console.warn('[ONBOARDING] Updating profile for userId:', userId, '| data:', JSON.stringify(data));

      const updateData: any = { updatedAt: new Date().toISOString() };
      if (data.username) updateData.username = data.username.toLowerCase();
      if (data.language) updateData.preferred_language = data.language;
      if (data.avatarUrl) updateData.avatarUrl = data.avatarUrl;
      if (data.topics) {
        updateData.selected_topics = data.topics;
        updateData.onboarding_complete = true;
      }
      if (data.onboarding_complete !== undefined) {
        updateData.onboarding_complete = data.onboarding_complete;
      }

      // Use maybeSingle() to avoid the "Cannot coerce" error
      const { data: updated, error: uErr } = await supabase
        .from('User')
        .update(updateData)
        .eq('id', userId)
        .select()
        .maybeSingle();

      if (uErr) {
        console.error('[ONBOARDING] Update error:', uErr);
        throw uErr;
      }

      if (updated) {
        console.warn('[ONBOARDING] ✅ Profile updated successfully');
        setUserProfile(updated);
        saveProfileToCache(updated);
        if (updated.onboarding_complete || data.onboarding_complete) setNeedsOnboarding(false);
      } else {
        // RLS might block returning updated data — re-fetch the profile
        console.warn('[ONBOARDING] Update returned no data, re-fetching profile...');
        const profile = await fetchProfile(userId);
        if (profile) {
          const merged = { ...profile, ...updateData };
          setUserProfile(merged);
          saveProfileToCache(merged);
        }
        if (data.topics || data.onboarding_complete) setNeedsOnboarding(false);
      }
      setUpdateProfileSuccess(true);
    } catch (e: any) {
      console.error('[ONBOARDING] Error:', e);
      setError('Something went wrong while updating your profile. Please try again.');
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Update Profile (General) ───
  const updateProfile = async (username: string, bio: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || userProfile?.id;

      if (!userId) throw new Error('Not authenticated.');

      const { data, error: uErr } = await supabase
        .from('User')
        .update({ username, bio, updatedAt: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .maybeSingle();

      if (uErr) throw uErr;
      setUserProfile(data);
      setUpdateProfileSuccess(true);
    } catch (e: any) {
      setError('Update failed');
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const clearState = () => {
    setError(null);
    setLoginSuccess(false);
    setSignupSuccess(false);
    setUpdateProfileSuccess(false);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      console.warn('[AUTH] signOut warning:', e);
    }
    try {
      await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        Object.keys(window.localStorage).forEach((k) => {
          if (k.startsWith('sb-') || k.includes('supabase') || k === PROFILE_CACHE_KEY) {
            window.localStorage.removeItem(k);
          }
        });
      }
    } catch (_) {}
    setUserProfile(null);
    setNeedsOnboarding(false);
    setIsAuthenticated(false);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{
      isLoading, error, loginSuccess, signupSuccess, updateProfileSuccess,
      isAuthenticated, needsOnboarding, userProfile,
      login, register, verifySignupOtp, sendPasswordReset, finalizeWebAuthCallback, ensureAuthenticatedUser,
      signInWithGoogleNative, signInWithGoogle, checkUsernameAvailability,
      updateOnboardingProfile, uploadProfileImage, updateProfile, clearState, logout
    }}>
      {!initializing && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Required for Expo AuthSession to intercept the redirect
WebBrowser.maybeCompleteAuthSession();

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
  register: (email: string, name: string, pass: string, mobile: string) => Promise<boolean | void>;
  verifySignupOtp: (email: string, token: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  checkUsernameAvailability: (username: string) => Promise<{ available: boolean; suggestions: string[] }>;
  updateOnboardingProfile: (data: { username?: string; language?: string; topics?: string[]; avatarUrl?: string }) => Promise<void>;
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

  // ─── Fetch profile from User table ───
  const fetchProfile = async (userId: string) => {
    try {
      let profileData = null;
      for (let attempt = 0; attempt < 5; attempt++) {
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
        // Wait longer on each retry to give the DB trigger time
        await new Promise(resolve => setTimeout(resolve, 800 * (attempt + 1)));
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
  };

  // ─── Check for existing session on mount ───
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          console.warn('[AUTH] Existing session found for:', session.user.email);
          const profile = await fetchProfile(session.user.id);

          if (profile?.role === 'CREATOR' || profile?.role === 'ADMIN') {
            console.warn('[AUTH] Non-citizen role, signing out');
            await supabase.auth.signOut();
          } else {
            setAuthState(profile, true);
          }
        } else {
          console.warn('[AUTH] No existing session');
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
      } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        const profile = await fetchProfile(session.user.id);
        setAuthState(profile, true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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

      setAuthState(profile, true);
      setLoginSuccess(true);
    } catch (e: any) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Direct Registration (No OTP) ───
  const register = async (email: string, name: string, pass: string, mobile: string) => {
    setIsLoading(true);
    setError(null);
    isRegisteringRef.current = true; // Guard: prevent onAuthStateChange from racing
    try {
      // ── Duplicate email check ──
      const { data: existingEmail } = await supabase
        .from('User')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (existingEmail) {
        setError('Email ID already exists. Please login instead.');
        setIsLoading(false);
        isRegisteringRef.current = false;
        return false;
      }

      // ── Duplicate phone check ──
      if (mobile.trim()) {
        const { data: existingPhone } = await supabase
          .from('User')
          .select('id')
          .eq('phone', mobile.trim())
          .maybeSingle();

        if (existingPhone) {
          setError('Mobile number already exists. Please login instead.');
          setIsLoading(false);
          isRegisteringRef.current = false;
          return false;
        }
      }

      // Generate a unique username for the profiles trigger (avoids unique constraint conflicts)
      const uniqueUsername = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: name,
            role: 'viewer',
            username: uniqueUsername,
          },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Email ID already exists. Please login instead.');
        } else if (authError.message.includes('Database error')) {
          setError('Registration failed. Please try again with a different email.');
        } else {
          setError(authError.message);
        }
        isRegisteringRef.current = false;
        return false;
      }

      if (authData.user) {
        console.warn('[AUTH] Auth user created:', authData.user.id);
        
        // Wait for any DB triggers to finish
        await new Promise(resolve => setTimeout(resolve, 2500));

        // Check if User row exists (may have been created by a DB trigger)
        const { data: existingUser } = await supabase
          .from('User')
          .select('id')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (existingUser) {
          // User row exists — update it with phone and set onboarding to false
          console.warn('[AUTH] User row exists, updating...');
          await supabase
            .from('User')
            .update({
              phone: mobile.trim(),
              onboarding_complete: false,
              updatedAt: new Date().toISOString(),
            })
            .eq('id', authData.user.id);
        } else {
          // User row does NOT exist — create it
          console.warn('[AUTH] User row does not exist, creating...');
          const { error: insertErr } = await supabase
            .from('User')
            .insert({
              id: authData.user.id,
              email: email.trim().toLowerCase(),
              phone: mobile.trim(),
              role: 'CITIZEN',
              onboarding_complete: false,
              createdAt: new Date().toISOString(),
            });
          if (insertErr) {
            console.error('[AUTH] Failed to insert User row:', insertErr);
            // Try updating instead (maybe race condition)
            await supabase
              .from('User')
              .update({
                phone: mobile.trim(),
                onboarding_complete: false,
              })
              .eq('id', authData.user.id);
          }
        }

        // Wait a bit then fetch the profile
        await new Promise(resolve => setTimeout(resolve, 500));
        const profile = await fetchProfile(authData.user.id);
        
        if (profile) {
          console.warn('[AUTH] ✅ Registration complete, onboarding_complete:', profile.onboarding_complete);
          setAuthState(profile, true);
          setSignupSuccess(true);
        } else {
          // Even if profile fetch fails, we know onboarding is needed
          console.warn('[AUTH] Profile not found after registration, forcing onboarding state');
          setUserProfile({ id: authData.user.id, email: email.trim().toLowerCase(), phone: mobile.trim(), onboarding_complete: false });
          setNeedsOnboarding(true);
          setIsAuthenticated(true);
          setSignupSuccess(true);
        }
      }

      return true;
    } catch (e: any) {
      console.error('[AUTH] Registration error:', e);
      setError('Registration failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
      isRegisteringRef.current = false;
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
        setAuthState(profile, true);
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

  // ─── Google OAuth Sign-In ───
  const signInWithGoogle = async () => {
    setIsLoading(true);
    setError(null);
    isHandlingOAuthRef.current = true; // Prevent onAuthStateChange from interfering

    try {
      const internalRedirectUrl = AuthSession.makeRedirectUri({
        scheme: 'app',
        path: 'auth/callback',
      });

      // Pass the app's redirect URL to the Vercel proxy so it knows where to redirect
      // The proxy will read ?appRedirect= and use it to construct the deep link
      const proxyBase = 'https://redirecting-pink.vercel.app/';
      const redirectTo = proxyBase + '?appRedirect=' + encodeURIComponent(internalRedirectUrl);

      console.warn('[GOOGLE AUTH] Internal redirect URL:', internalRedirectUrl);
      console.warn('[GOOGLE AUTH] Vercel proxy with appRedirect:', redirectTo);

      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (authError) throw authError;
      if (!data?.url) throw new Error('No OAuth URL received from Supabase');

      console.warn('[GOOGLE AUTH] Opening browser with OAuth URL');

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        internalRedirectUrl,
        { showInRecents: true }
      );

      console.warn('[GOOGLE AUTH] Browser result type:', result.type);

      if (result.type === 'success' && result.url) {
        console.warn('[GOOGLE AUTH] Success URL received:', result.url.substring(0, 80) + '...');

        // Parse tokens from the deep link URL
        const { accessToken, refreshToken } = getTokensFromUrl(result.url);

        if (accessToken && refreshToken) {
          console.warn('[GOOGLE AUTH] Tokens extracted, setting session...');

          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) throw sessionError;

          if (sessionData.user) {
            console.warn('[GOOGLE AUTH] Session set for:', sessionData.user.email);
            // Wait for the database trigger to create the User row
            await new Promise(resolve => setTimeout(resolve, 2000));
            const profile = await fetchProfile(sessionData.user.id);
            setAuthState(profile, true);
            setLoginSuccess(true);
            console.warn('[GOOGLE AUTH] ✅ Auth complete! needsOnboarding:', checkOnboardingStatus(profile));
          }

          WebBrowser.dismissBrowser();
        } else {
          console.warn('[GOOGLE AUTH] ❌ No tokens found in URL');
          setError('Authentication failed — no tokens received. Please try again.');
        }
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        console.warn('[GOOGLE AUTH] User cancelled/dismissed');
        setError('Google sign-in was cancelled');
      }
    } catch (e: any) {
      console.error('[GOOGLE AUTH] Error:', e);
      setError(e.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setIsLoading(false);
      // Re-enable onAuthStateChange listener after a short delay
      setTimeout(() => {
        isHandlingOAuthRef.current = false;
      }, 2000);
    }
  };

  const getTokensFromUrl = (url: string) => {
    try {
      // Tokens can be in either hash fragment (#) or query string (?)
      const hashPart = url.includes('#') ? url.split('#')[1] : '';
      const queryPart = url.includes('?') ? url.split('?')[1] : '';
      const dataString = hashPart || queryPart || '';

      if (!dataString) return { accessToken: null, refreshToken: null };

      const params = new URLSearchParams(dataString);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      console.warn('[GOOGLE AUTH] Token extraction → access:', !!accessToken, '| refresh:', !!refreshToken);
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

      const { data, error } = await supabase
        .from('User')
        .select('username')
        .eq('username', cleanUsername);

      if (error) throw error;
      const isAvailable = !data || data.length === 0;

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
    const supabaseUrl = 'https://vxenjlgoatbkfrfrkoeq.supabase.co';
    const supabaseKey = 'sb_publishable_BnXqtLVTeJtbCmI4ipng5A_kOCulArG';

    try {
      // React Native FormData with {uri, name, type} — RN reads the file natively
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        name: `avatar.${fileExt}`,
        type: contentType,
      } as any);

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
  const updateOnboardingProfile = async (data: { username?: string; language?: string; topics?: string[]; avatarUrl?: string }) => {
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
        if (updated.onboarding_complete) setNeedsOnboarding(false);
      } else {
        // RLS might block returning updated data — re-fetch the profile
        console.warn('[ONBOARDING] Update returned no data, re-fetching profile...');
        const profile = await fetchProfile(userId);
        if (profile) setUserProfile(profile);
        if (data.topics) setNeedsOnboarding(false);
      }
      setUpdateProfileSuccess(true);
    } catch (e: any) {
      console.error('[ONBOARDING] Error:', e.message);
      setError(e.message || 'Update failed');
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
    await supabase.auth.signOut();
    setAuthState(null, false);
  };

  return (
    <AuthContext.Provider value={{
      isLoading, error, loginSuccess, signupSuccess, updateProfileSuccess,
      isAuthenticated, needsOnboarding, userProfile,
      login, register, verifySignupOtp, signInWithGoogle, checkUsernameAvailability,
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

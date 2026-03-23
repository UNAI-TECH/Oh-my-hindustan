import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// This is required for Expo AuthSession to intercept the redirect from the browser back to the app
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
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, name: string, pass: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  checkUsernameAvailability: (username: string) => Promise<{ available: boolean; suggestions: string[] }>;
  updateOnboardingProfile: (data: { username?: string; language?: string; topics?: string[] }) => Promise<void>;
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

  const fetchProfile = async (userId: string) => {
    try {
      // Give the trigger a small moment to create the profile (especially on first signup)
      // Retry logic to handle potential race conditions with Supabase triggers
      let profileData = null;
      for (let i = 0; i < 3; i++) { // Try up to 3 times
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(); // maybeSingle doesn't throw if 0 rows found

        if (profileError) throw profileError;

        if (data) {
          profileData = data;
          break; // Profile found, exit loop
        }
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retrying
      }

      if (profileData) {
        setUserProfile(profileData);
        setNeedsOnboarding(!profileData.onboarding_complete);
        return profileData;
      } else {
        // If profile doesn't exist after retries, it definitely needs onboarding
        setNeedsOnboarding(true);
        setUserProfile(null);
        return null;
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setUserProfile(null);
      setNeedsOnboarding(true); // Assume onboarding needed if profile fetch fails
      return null;
    }
  };

  const checkOnboardingStatus = (profile: any): boolean => {
    if (!profile) return true;
    return !profile.onboarding_complete;
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const profile = await fetchProfile(session.user.id);

          if (profile?.role === 'creator' || profile?.role === 'admin') {
            await supabase.auth.signOut();
          } else {
            setIsAuthenticated(true);
            setUserProfile(profile);
            setNeedsOnboarding(checkOnboardingStatus(profile));
          }
        }
      } catch (e) {
        console.error('Session check failed:', e);
      } finally {
        setInitializing(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUserProfile(null);
        setNeedsOnboarding(false);
      } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUserProfile(profile);
        setIsAuthenticated(true);
        setNeedsOnboarding(checkOnboardingStatus(profile));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
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

      if (profile?.role === 'creator' || profile?.role === 'admin') {
        setError('This app is for viewers. Please use the appropriate dashboard for your role.');
        await supabase.auth.signOut();
        return;
      }

      setUserProfile(profile);
      setNeedsOnboarding(checkOnboardingStatus(profile));
      setLoginSuccess(true);
      setIsAuthenticated(true);
    } catch (e: any) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, name: string, pass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            username: '',
            full_name: name,
            role: 'viewer',
          },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('This email is already registered. Please login instead.');
        } else {
          setError(authError.message);
        }
        return;
      }

      if (authData.user) {
        // Wait a moment for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const profile = await fetchProfile(authData.user.id);

        setUserProfile(profile);
        setNeedsOnboarding(true);
        setSignupSuccess(true);
        setIsAuthenticated(true);
      }
    } catch (e: any) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'app',
        path: 'auth/callback',
      });

      console.warn('Redirecting to Google. Ensure this URI is in your Supabase Redirect URLs:', redirectUrl);

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        return;
      }

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl,
        );

        if (result.type === 'success') {
          const url = result.url;
          // Extract tokens from URL
          const params = new URL(url);
          const hashParams = new URLSearchParams(params.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              setError(sessionError.message);
              return;
            }

            if (sessionData.user) {
              // Wait for trigger to create profile  
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              const profile = await fetchProfile(sessionData.user.id);
              setUserProfile(profile);
              setNeedsOnboarding(checkOnboardingStatus(profile));
              setIsAuthenticated(true);
              setLoginSuccess(true);
            }
          }
        } else {
          setError('Google sign-in was cancelled.');
        }
      }
    } catch (e: any) {
      console.error('Google sign-in error:', e);
      setError('Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkUsernameAvailability = async (username: string): Promise<{ available: boolean; suggestions: string[] }> => {
    try {
      const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
      
      if (cleanUsername.length < 3) {
        return { available: false, suggestions: [] };
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', cleanUsername);

      if (error) {
        console.error('Username check error:', error);
        return { available: false, suggestions: [] };
      }

      const isAvailable = !data || data.length === 0;

      if (isAvailable) {
        return { available: true, suggestions: [] };
      }

      // Generate suggestions
      const suggestions: string[] = [];
      const baseName = cleanUsername.replace(/[0-9]+$/, '');
      
      const candidateUsernames = [
        `${baseName}_${Math.floor(Math.random() * 999)}`,
        `${baseName}${Math.floor(Math.random() * 9999)}`,
        `${baseName}_official`,
        `the_${baseName}`,
        `${baseName}_${new Date().getFullYear()}`,
      ];

      // Check which suggestions are available
      const { data: existingUsernames } = await supabase
        .from('profiles')
        .select('username')
        .in('username', candidateUsernames);

      const takenSet = new Set((existingUsernames || []).map((u: any) => u.username));

      for (const candidate of candidateUsernames) {
        if (!takenSet.has(candidate) && suggestions.length < 3) {
          suggestions.push(candidate);
        }
      }

      return { available: false, suggestions };
    } catch (e) {
      console.error('Username check failed:', e);
      return { available: false, suggestions: [] };
    }
  };

  const updateOnboardingProfile = async (data: { username?: string; language?: string; topics?: string[] }) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updateData: any = {};
      if (data.username) updateData.username = data.username.toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (data.language) updateData.preferred_language = data.language;
      if (data.topics) {
        updateData.selected_topics = data.topics;
        updateData.onboarding_complete = true;
      }

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        if (updateError.message.includes('unique') || updateError.message.includes('duplicate')) {
          setError('This username is already taken. Please choose another.');
        } else {
          setError(updateError.message);
        }
        throw updateError;
      }

      setUserProfile(updatedProfile);
      if (updatedProfile.onboarding_complete) {
        setNeedsOnboarding(false);
      }
      setUpdateProfileSuccess(true);
    } catch (e: any) {
      if (!error) setError('Failed to update profile.');
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (username: string, bio: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ username, bio })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setUserProfile(data);
      setUpdateProfileSuccess(true);
    } catch (e: any) {
      setError('Failed to update profile.');
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
    setIsAuthenticated(false);
    setUserProfile(null);
    setNeedsOnboarding(false);
  };

  if (initializing) {
    return null;
  }

  return (
    <AuthContext.Provider value={{
      isLoading, error, loginSuccess, signupSuccess, updateProfileSuccess, 
      isAuthenticated, needsOnboarding, userProfile,
      login, register, signInWithGoogle, checkUsernameAvailability,
      updateOnboardingProfile, updateProfile, clearState, logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

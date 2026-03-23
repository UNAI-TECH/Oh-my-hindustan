import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthApi } from '../api/services';
import { SessionManager } from '../utils/storage';

interface AuthContextProps {
  isLoading: boolean;
  error: string | null;
  loginSuccess: boolean;
  signupSuccess: boolean;
  updateProfileSuccess: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, name: string, pass: string) => Promise<void>;
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

  useEffect(() => {
    SessionManager.getToken().then(token => {
      if (token) setIsAuthenticated(true);
    });
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Assuming mapping from Kotlin network logic
      const response = await AuthApi.login({ username: email, password: pass });
      await SessionManager.saveSession(response.access_token, response.user.id ?? null, response.user.username ?? null, response.user.email ?? null);
      setLoginSuccess(true);
      setIsAuthenticated(true);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, name: string, pass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await AuthApi.register({ email, username: name, password: pass });
      await SessionManager.saveSession(response.access_token, response.user.id ?? null, response.user.username ?? null, response.user.email ?? null);
      setSignupSuccess(true);
      setIsAuthenticated(true);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Registration failed. Email might be taken.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (username: string, bio: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await AuthApi.updateProfile({ username, bio });
      await SessionManager.saveSession('', response.id ?? null, response.username ?? null, response.email ?? null);
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
    await SessionManager.clearSession();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      isLoading, error, loginSuccess, signupSuccess, updateProfileSuccess, isAuthenticated,
      login, register, updateProfile, clearState, logout
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

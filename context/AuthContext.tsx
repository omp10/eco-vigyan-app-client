import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import authService, { User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  setAuthUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const currentUser = await authService.checkAuth();
      setUser(currentUser);
    } catch (error) {
      console.error('Auth status check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async () => {
    try {
      setLoading(true);
      const { user: newUser } = await authService.googleSignIn();
      setUser(newUser);
    } catch (error: any) {
      console.error('Sign in failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }

  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { user: newUser } = await authService.login(email, password);
      setUser(newUser);
    } catch (error: any) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    login,
    signOut,
    isAuthenticated: !!user,
    setAuthUser: setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

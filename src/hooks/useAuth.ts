import { useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
  level: number;
  xp: number;
  rank: string;
  preferences: Record<string, any>;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  // Initialize auth state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = useCallback(async () => {
    try {
      // For now, we'll create a mock user
      // In a real app, this would check localStorage, cookies, or make an API call
      const mockUser: User = {
        id: 'user_1',
        username: 'trader_pro',
        email: 'trader@example.com',
        level: 1,
        xp: 0,
        rank: 'Novice',
        preferences: {
          theme: 'light',
          notifications: true,
          soundEnabled: true
        }
      };

      // Simulate async auth check
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAuthState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      });
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Mock login logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user: User = {
        id: `user_${Date.now()}`,
        username,
        email: `${username}@example.com`,
        level: 1,
        xp: 0,
        rank: 'Novice',
        preferences: {
          theme: 'light',
          notifications: true,
          soundEnabled: true
        }
      };
      
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      return user;
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed'
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Mock logout logic
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Logout failed'
      }));
    }
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!authState.user) return;
    
    setAuthState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : null
    }));
  }, [authState.user]);

  const refreshAuth = useCallback(async () => {
    await initializeAuth();
  }, [initializeAuth]);

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    error: authState.error,
    login,
    logout,
    updateUser,
    refreshAuth
  };
};
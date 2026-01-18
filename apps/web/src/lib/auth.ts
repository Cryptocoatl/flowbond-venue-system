import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from './api';

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  language: string;
  isGuest: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Auth operations
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, language?: string) => Promise<void>;
  loginAsGuest: (language?: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  updateLanguage: (language: string) => Promise<void>;
  convertGuest: (email: string, password: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.login(email, password);
          set({ user: data.user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.message || 'Login failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },
      
      register: async (email: string, password: string, language: string = 'en') => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.register(email, password, language);
          set({ user: data.user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.message || 'Registration failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },
      
      loginAsGuest: async (language: string = 'en') => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.loginAsGuest(language);
          set({ user: data.user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.message || 'Guest login failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },
      
      logout: async () => {
        await api.logout();
        set({ user: null, isAuthenticated: false });
      },
      
      fetchUser: async () => {
        if (!api.isAuthenticated()) {
          return;
        }
        
        set({ isLoading: true });
        try {
          const user = await api.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },
      
      updateLanguage: async (language: string) => {
        try {
          const user = await api.updateLanguage(language);
          set({ user });
        } catch (error: any) {
          const message = error.response?.data?.message || 'Failed to update language';
          set({ error: message });
          throw error;
        }
      },
      
      convertGuest: async (email: string, password: string) => {
        const { user } = get();
        if (!user?.isGuest) {
          throw new Error('Not a guest user');
        }
        
        set({ isLoading: true, error: null });
        try {
          const updatedUser = await api.updateMe({ email });
          // Note: Password update would need a separate endpoint
          set({ user: { ...updatedUser, isGuest: false }, isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.message || 'Conversion failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: 'flowbond-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// Auth guard hook
export function useRequireAuth() {
  const { isAuthenticated, isLoading, fetchUser } = useAuthStore();
  
  // Fetch user on mount if we think we're authenticated but don't have user data
  if (isAuthenticated && !useAuthStore.getState().user && !isLoading) {
    fetchUser();
  }
  
  return { isAuthenticated, isLoading };
}

// Staff guard hook
export function useRequireStaff() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const isStaff = user?.isStaff || user?.isAdmin;
  
  return { isStaff: !!isStaff, isAuthenticated, isLoading };
}

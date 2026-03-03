import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/lib/apiClient';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,

      login: async (email, password) => {
        const { data } = await apiClient.post('/auth/login', { email, password });
        set({ user: data.data.user, accessToken: data.data.accessToken });
      },

      setAuth: (user, accessToken) => set({ user, accessToken }),

      logout: () => {
        set({ user: null, accessToken: null });
      },
    }),
    { name: 'motixai-auth' }
  )
);

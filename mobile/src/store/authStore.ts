import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../lib/apiClient';

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
  logout: () => void;
  rehydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,

  login: async (email, password) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    const { user, accessToken, refreshToken } = data.data;
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    set({ user, accessToken });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ user: null, accessToken: null });
  },

  rehydrate: async () => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) return;
    try {
      const { data } = await apiClient.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ user: data.data, accessToken: token });
    } catch {
      await SecureStore.deleteItemAsync('accessToken');
    }
  },
}));

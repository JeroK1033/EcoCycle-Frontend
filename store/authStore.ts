import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

type AuthState = {
  token: string | null;
  userId: string | null;
  email: string | null;
  isLoaded: boolean;
  setAuth: (token: string, userId: string, email: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  loadAuth: () => Promise<void>;
};

export const authStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  email: null,
  isLoaded: false,

  setAuth: async (token, userId, email) => {
    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('userId', userId);
    await SecureStore.setItemAsync('email', email);
    set({ token, userId, email });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('userId');
    await SecureStore.deleteItemAsync('email');
    set({ token: null, userId: null, email: null });
  },

  loadAuth: async () => {
    try {
      const token  = await SecureStore.getItemAsync('token');
      const userId = await SecureStore.getItemAsync('userId');
      const email  = await SecureStore.getItemAsync('email');
      set({ token, userId, email, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },
}));

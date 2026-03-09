import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      setUser: (user, token) =>
        set({ user, token, error: null }),

      setLoading: (isLoading) =>
        set({ isLoading }),

      setError: (error) =>
        set({ error }),

      logout: () =>
        set({ user: null, token: null, error: null }),
    }),
    {
      name: 'hris_auth',
      storage: localStorage,
    }
  )
);

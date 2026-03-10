import { create } from 'zustand';
import api from '../lib/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isInitialized: false,

  setUser: (user, token) => {
    set({ user, token, error: null });
  },

  setLoading: (isLoading) =>
    set({ isLoading }),

  setError: (error) =>
    set({ error }),

  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;

      // Save to localStorage
      localStorage.setItem('hris_token', token);
      localStorage.setItem('hris_user', JSON.stringify(user));

      // Update store
      set({ user, token, error: null });

      // Return the data so caller can use role/status
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Login failed';
      set({ error: message });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('hris_token');
    localStorage.removeItem('hris_user');
    set({ user: null, token: null, error: null });
  },

  // Initialize auth state from localStorage on app load (runs only once)
  initAuth: () => {
    // Clear any old zustand persist key
    localStorage.removeItem('hris_auth');

    // Guard: only run once
    if (get().isInitialized) return;

    const token = localStorage.getItem('hris_token');
    const userJson = localStorage.getItem('hris_user');

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        set({ user, token, isInitialized: true });
      } catch (error) {
        localStorage.removeItem('hris_token');
        localStorage.removeItem('hris_user');
        set({ isInitialized: true });
      }
    } else {
      set({ isInitialized: true });
    }
  },
}));

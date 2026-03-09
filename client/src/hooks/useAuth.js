import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

/**
 * Custom hook for authentication operations
 */
export const useAuth = () => {
  const { user, token, setUser, logout } = useAuthStore();

  const getProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      throw error;
    }
  };

  const logoutUser = async () => {
    try {
      await api.post('/auth/logout');
      logout();
      localStorage.removeItem('hris_token');
      localStorage.removeItem('hris_user');
    } catch (error) {
      console.error('Logout error:', error);
      // Still logout locally even if API call fails
      logout();
      localStorage.removeItem('hris_token');
      localStorage.removeItem('hris_user');
    }
  };

  return {
    user,
    token,
    isAuthenticated: !!user,
    getProfile,
    logout: logoutUser,
  };
};

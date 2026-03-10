import React, { useEffect } from 'react';
import AppRouter from './router/AppRouter';
import { useAuthStore } from './store/authStore';

function App() {
  const { user, token, initAuth } = useAuthStore();

  // Initialize auth state from localStorage on app mount (run once)
  useEffect(() => {
    console.log('[App] Initializing auth state...');
    initAuth();
  }, []);

  // Log auth state for debugging
  useEffect(() => {
    console.log('[App] Auth state updated - user:', user, 'token exists:', !!token);
  }, [user, token]);

  return <AppRouter />;
}

export default App;

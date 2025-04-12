import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { login as loginService, logout as logoutService, isAuthenticated as checkAuth } from '../services/authService';
import { loginSuccess, loginFailure, logout as logoutAction } from '../store/slices/authSlice';

// Create context with default values
export const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  logout: () => {},
});

/**
 * Authentication Provider Component
 * Manages authentication state and provides login/logout functions
 */
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get dispatch function from Redux
  const dispatch = useDispatch();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        setLoading(true);
        const isAuth = checkAuth();
        setIsAuthenticated(isAuth);

        // Set a basic user object if authenticated
        if (isAuth) {
          // Extract email from token if possible (simplified)
          const token = localStorage.getItem('token');
          let email = 'user@example.com'; // Default fallback

          if (token) {
            try {
              // Simple parsing of JWT payload (not secure, just for display)
              const base64Url = token.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const payload = JSON.parse(window.atob(base64));
              if (payload.email) {
                email = payload.email;
              }
            } catch (e) {
              console.error('Error parsing token:', e);
            }
          }

          const userData = { email };
          setUser(userData);

          // Update Redux store
          dispatch(loginSuccess({
            user: userData,
            token: token
          }));
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setError('Session verification failed');
        // Clear token if verification fails
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
  }, [dispatch]);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const data = await loginService(email, password);
      setIsAuthenticated(true);

      // Set user data if available in response
      if (data && data.user) {
        setUser(data.user);

        // Update Redux store
        dispatch(loginSuccess({
          user: data.user,
          token: data.token || localStorage.getItem('token')
        }));
      }

      return data;
    } catch (err) {
      setError(err.message || 'Login failed');

      // Update Redux store with error
      dispatch(loginFailure(err.message || 'Login failed'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  // Logout function
  const logout = useCallback(() => {
    logoutService();
    setIsAuthenticated(false);
    setUser(null);

    // Update Redux store
    dispatch(logoutAction());
  }, [dispatch]);

  // Context value
  const contextValue = {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

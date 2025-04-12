import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  login as loginService,
  logout as logoutService,
  isAuthenticated as checkAuth,
  getCurrentUserFromStorage,
  refreshToken
} from '../services/authService';
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

        // Set user object if authenticated
        if (isAuth) {
          // Get user data from storage
          const userData = getCurrentUserFromStorage();

          if (userData) {
            setUser(userData);

            // Get token from storage
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') ||
                         localStorage.getItem('token') || sessionStorage.getItem('token');

            // Update Redux store
            dispatch(loginSuccess({
              user: userData,
              token: token
            }));
          } else {
            // If no user data but token is valid, try to refresh token
            try {
              const refreshData = await refreshToken();
              if (refreshData && refreshData.token) {
                // Authentication is valid, but we'll check again on the next cycle
                console.log('Token refreshed during initial auth check');
              }
            } catch (refreshError) {
              console.error('Token refresh failed during auth check:', refreshError);
              setIsAuthenticated(false);
              setError('Session expired. Please login again.');
            }
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setError('Session verification failed');
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

import { post, get } from './apiService';
import { STORAGE_KEYS } from '../config/constants';
import { setAuthToken, registerTokenSetter } from '../utils/axiosConfig';

// Register a token setter function to avoid circular dependencies
registerTokenSetter((token) => {
  if (token) {
    // Store token in both localStorage and sessionStorage for maximum compatibility
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  } else {
    // Clear token from both storage types
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }
});

// Token refresh timer
let refreshTokenTimer = null;

/**
 * Store authentication data
 * @param {Object} data - Authentication data
 * @param {string} data.token - JWT token
 * @param {Object} data.user - User data
 * @param {boolean} remember - Whether to remember user
 */
const storeAuthData = (data, remember = false) => {
  if (!data || !data.token) {
    console.warn('No token received from server');
    return;
  }

  // Store token in localStorage or sessionStorage based on remember preference
  const storage = remember ? localStorage : sessionStorage;

  // Store token
  storage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);

  // Set token in axios
  setAuthToken(data.token);

  // Store user data if available
  if (data.user) {
    storage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
  }

  // Set up token refresh timer
  setupTokenRefresh(data.token);

  console.log('Authentication data stored successfully');
};

/**
 * Clear authentication data
 */
const clearAuthData = () => {
  // Clear from both storage types to be safe
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.USER);

  // Clear token in axios
  setAuthToken(null);

  // Clear refresh timer
  if (refreshTokenTimer) {
    clearTimeout(refreshTokenTimer);
    refreshTokenTimer = null;
  }
};

/**
 * Set up token refresh timer
 * @param {string} token - JWT token
 */
const setupTokenRefresh = (token) => {
  // Clear any existing timer
  if (refreshTokenTimer) {
    clearTimeout(refreshTokenTimer);
  }

  try {
    // Parse token to get expiration time
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresIn = payload.exp * 1000 - Date.now();

    // Set timer to refresh token 1 minute before expiration
    const refreshTime = Math.max(expiresIn - 60000, 0);

    if (refreshTime > 0) {
      refreshTokenTimer = setTimeout(() => {
        refreshToken().catch(err => {
          console.error('Token refresh failed:', err);
        });
      }, refreshTime);

      console.log(`Token refresh scheduled in ${Math.round(refreshTime / 1000)} seconds`);
    }
  } catch (error) {
    console.error('Failed to setup token refresh:', error);
  }
};

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {boolean} remember - Whether to remember user
 * @returns {Promise<Object>} Response with token and user data
 */
export const login = async (email, password, remember = false) => {
  try {
    const data = await post('/api/auth/login', { email, password }, false);
    storeAuthData(data, remember);
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw new Error(error.message || 'Login failed');
  }
};

/**
 * Register new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} username - Optional username
 * @returns {Promise<Object>} Registration response
 */
export const register = async (email, password, username = '') => {
  try {
    return await post('/api/auth/register', {
      email,
      password,
      username: username || email.split('@')[0]
    }, false);
  } catch (error) {
    console.error('Registration error:', error);
    throw new Error(error.message || 'Registration failed');
  }
};

/**
 * Refresh access token
 * @returns {Promise<Object>} New token
 */
export const refreshToken = async () => {
  try {
    const data = await post('/api/auth/refresh-token', {}, true);

    if (data && data.token) {
      // Update token in storage (keep the same storage type)
      const storage = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
        ? localStorage
        : sessionStorage;

      storage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);

      // Set token in axios
      setAuthToken(data.token);

      // Set up new refresh timer
      setupTokenRefresh(data.token);

      console.log('Token refreshed successfully');
    }

    return data;
  } catch (error) {
    console.error('Token refresh error:', error);
    // Clear auth data on refresh failure
    clearAuthData();
    throw new Error('Session expired. Please login again.');
  }
};

/**
 * Logout user
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    // Call logout endpoint to invalidate token on server
    await post('/api/auth/logout', {});
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear auth data regardless of server response
    clearAuthData();
  }
};

/**
 * Get current user profile
 * @returns {Promise<Object>} User profile
 */
export const getCurrentUser = async () => {
  try {
    return await get('/api/auth/me');
  } catch (error) {
    console.error('Get user profile error:', error);
    throw new Error(error.message || 'Failed to get user profile');
  }
};

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise<Object>} Response
 */
export const forgotPassword = async (email) => {
  try {
    return await post('/api/auth/forgot-password', { email }, false);
  } catch (error) {
    console.error('Password reset request error:', error);
    throw new Error(error.message || 'Failed to request password reset');
  }
};

/**
 * Reset password with token
 * @param {string} token - Reset token
 * @param {string} password - New password
 * @returns {Promise<Object>} Response
 */
export const resetPassword = async (token, password) => {
  try {
    return await post(`/api/auth/reset-password/${token}`, { password }, false);
  } catch (error) {
    console.error('Password reset error:', error);
    throw new Error(error.message || 'Failed to reset password');
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
export const isAuthenticated = () => {
  // Check both storage types
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
               sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

  if (!token) {
    return false;
  }

  try {
    // Validate token format
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid token format');
      clearAuthData();
      return false;
    }

    // Check if token is expired
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.warn('Token expired');
      clearAuthData();
      return false;
    }

    // Set up refresh timer if not already set
    if (!refreshTokenTimer) {
      setupTokenRefresh(token);
    }

    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    clearAuthData();
    return false;
  }
};

/**
 * Get current user data from storage
 * @returns {Object|null} User data or null if not authenticated
 */
export const getCurrentUserFromStorage = () => {
  // Check both storage types
  const userJson = localStorage.getItem(STORAGE_KEYS.USER) ||
                  sessionStorage.getItem(STORAGE_KEYS.USER);

  if (!userJson) {
    return null;
  }

  try {
    return JSON.parse(userJson);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

import { post } from './apiService';

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Response with token
 */
export const login = async (email, password) => {
  try {
    const data = await post('/api/auth/login', { email, password }, false);
    // Store token in localStorage
    if (data && data.token) {
      localStorage.setItem('token', data.token);
      console.log('Token stored successfully');
    } else {
      console.warn('No token received from server');
    }
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
 * @returns {Promise<void>}
 */
export const register = async (email, password) => {
  try {
    return await post('/api/auth/register', { email, password }, false);
  } catch (error) {
    throw new Error(error.message || 'Registration failed');
  }
};

/**
 * Logout user
 * @returns {void}
 */
export const logout = () => {
  localStorage.removeItem('token');
  // Optionally, you can call an API endpoint to invalidate the token on the server
};

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return false;
  }

  try {
    // Simple validation - check if token has three parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid token format');
      localStorage.removeItem('token'); // Clear invalid token
      return false;
    }

    // Check if token is expired (simplified)
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.warn('Token expired');
      localStorage.removeItem('token'); // Clear expired token
      return false;
    }

    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    localStorage.removeItem('token'); // Clear invalid token
    return false;
  }
};

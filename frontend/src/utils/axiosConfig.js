import axios from 'axios';
import { API_URL, ERROR_MESSAGES, STORAGE_KEYS } from '../config/constants';

// Create an axios instance with default configuration
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Variable to store the token setter function
let tokenSetter = null;

/**
 * Register a token setter function to avoid circular dependencies
 * @param {Function} setter - Function to set the token
 */
export const registerTokenSetter = (setter) => {
  tokenSetter = setter;
};

/**
 * Set auth token manually
 * @param {string} token - Auth token
 */
export const setAuthToken = (token) => {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('Manually set auth token:', token.substring(0, 10) + '...');

    // Call the registered token setter if available
    if (tokenSetter) {
      tokenSetter(token);
    }
  } else {
    delete axiosInstance.defaults.headers.common['Authorization'];
    console.warn('Cleared auth token');

    // Call the registered token setter if available
    if (tokenSetter) {
      tokenSetter(null);
    }
  }
};

/**
 * Add request interceptor to include auth token
 */
axiosInstance.interceptors.request.use(
  (config) => {
    // Check if Authorization header is already set
    if (!config.headers.Authorization) {
      // Get token from localStorage using multiple possible keys
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
                   sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
                   localStorage.getItem('token') ||
                   sessionStorage.getItem('token');

      // If token exists, add it to the request headers
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Added auth token to request:', token.substring(0, 10) + '...');
      } else {
        console.warn('No auth token found in storage');

        // Try to get token from Redux store
        try {
          if (window.reduxStore && window.reduxStore.getState) {
            const state = window.reduxStore.getState();
            if (state.auth && state.auth.token) {
              const reduxToken = state.auth.token;
              config.headers.Authorization = `Bearer ${reduxToken}`;
              console.log('Using token from Redux store:', reduxToken.substring(0, 10) + '...');

              // Save the token to localStorage for future requests
              localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, reduxToken);
            }
          }
        } catch (error) {
          console.error('Error accessing Redux store:', error);
        }
      }
    }

    // For debugging - log the request details
    console.log('Request URL:', config.baseURL + config.url);
    console.log('Request Method:', config.method?.toUpperCase() || 'GET');
    console.log('Has Auth Header:', !!config.headers.Authorization);

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Add response interceptor to handle common errors
 */
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.response) {
      // Server responded with an error status code
      if (error.response.status === 401) {
        // Unauthorized - could handle token refresh or logout here
        console.warn(ERROR_MESSAGES.AUTH.SESSION_EXPIRED);
      } else if (error.response.status === 404) {
        console.warn(ERROR_MESSAGES.NOT_FOUND, error.config.url);
      } else if (error.response.status >= 500) {
        console.error(ERROR_MESSAGES.GENERIC, error.response.status);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error(ERROR_MESSAGES.NETWORK);
    } else {
      // Error in setting up the request
      console.error(ERROR_MESSAGES.GENERIC, error.message);
    }

    return Promise.reject(error);
  }
);



export default axiosInstance;

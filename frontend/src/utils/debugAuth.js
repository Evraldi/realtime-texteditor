/**
 * Debug utility for authentication issues
 */
import { STORAGE_KEYS } from '../config/constants';

/**
 * Log all authentication-related information to the console
 * This is useful for debugging authentication issues
 */
export const debugAuth = () => {
  console.group('Auth Debug Info');
  
  // Check localStorage
  const localStorageToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const localStorageTokenOld = localStorage.getItem('token');
  console.log('localStorage[AUTH_TOKEN]:', localStorageToken ? `${localStorageToken.substring(0, 10)}...` : 'null');
  console.log('localStorage[token]:', localStorageTokenOld ? `${localStorageTokenOld.substring(0, 10)}...` : 'null');
  
  // Check sessionStorage
  const sessionStorageToken = sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const sessionStorageTokenOld = sessionStorage.getItem('token');
  console.log('sessionStorage[AUTH_TOKEN]:', sessionStorageToken ? `${sessionStorageToken.substring(0, 10)}...` : 'null');
  console.log('sessionStorage[token]:', sessionStorageTokenOld ? `${sessionStorageTokenOld.substring(0, 10)}...` : 'null');
  
  // Check Redux store
  try {
    if (window.reduxStore) {
      const state = window.reduxStore.getState();
      const reduxToken = state.auth?.token;
      console.log('Redux store token:', reduxToken ? `${reduxToken.substring(0, 10)}...` : 'null');
    } else {
      console.log('Redux store not available globally');
    }
  } catch (error) {
    console.error('Error accessing Redux store:', error);
  }
  
  // Check axios default headers
  try {
    const axiosHeaders = window.axios?.defaults?.headers?.common?.Authorization;
    console.log('Axios default Authorization header:', axiosHeaders || 'not set');
  } catch (error) {
    console.error('Error accessing axios headers:', error);
  }
  
  console.groupEnd();
  
  return {
    localStorage: {
      authToken: localStorageToken,
      token: localStorageTokenOld
    },
    sessionStorage: {
      authToken: sessionStorageToken,
      token: sessionStorageTokenOld
    }
  };
};

/**
 * Fix authentication token issues by consolidating tokens
 * This will copy the token from any available source to all storage locations
 * @returns {string|null} The consolidated token or null if no token was found
 */
export const fixAuthTokens = () => {
  // Find the first available token
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
                sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
                localStorage.getItem('token') ||
                sessionStorage.getItem('token');
  
  if (!token) {
    console.warn('No auth token found in any storage location');
    return null;
  }
  
  // Store the token in all locations
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  localStorage.setItem('token', token);
  sessionStorage.setItem('token', token);
  
  console.log('Auth tokens consolidated successfully');
  
  // Update Redux store if available
  try {
    if (window.reduxStore) {
      const state = window.reduxStore.getState();
      if (state.auth && !state.auth.token) {
        // Dispatch action to update token in Redux store
        window.reduxStore.dispatch({
          type: 'auth/loginSuccess',
          payload: {
            user: state.auth.user,
            token: token
          }
        });
        console.log('Redux store token updated');
      }
    }
  } catch (error) {
    console.error('Error updating Redux store:', error);
  }
  
  return token;
};

export default {
  debugAuth,
  fixAuthTokens
};

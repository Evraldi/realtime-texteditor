/**
 * API Service Configuration
 *
 * This file contains the configuration for API requests,
 * including base URL, headers, and interceptors.
 */
import { STORAGE_KEYS } from '../config/constants';
import { refreshToken as refreshAuthToken } from './authService';

// Get the API base URL from environment variables or use relative URL
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || '';

// Flag to prevent multiple simultaneous token refresh attempts
let isRefreshing = false;

// Queue of requests waiting for token refresh
let refreshQueue = [];

/**
 * Creates headers for API requests
 * @param {boolean} includeAuth - Whether to include authentication token
 * @returns {Object} Headers object
 */
export const createHeaders = (includeAuth = false) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    // Check both localStorage and sessionStorage for token
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
                 sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

/**
 * Processes API response
 * @param {Response} response - Fetch response
 * @returns {Promise<Object>} Processed response data
 */
const processResponse = async (response) => {
  // For 204 No Content responses, return empty object
  if (response.status === 204) {
    return null;
  }

  // For other responses, try to parse JSON
  try {
    return await response.json();
  } catch (e) {
    console.warn('Failed to parse response as JSON:', e);
    return {}; // Return empty object if parsing fails
  }
};

/**
 * Handles token refresh and retries the original request
 * @param {string} endpoint - Original API endpoint
 * @param {Object} options - Original request options
 * @returns {Promise<Object>} API response
 */
const handleTokenRefresh = async (endpoint, options) => {
  // If already refreshing, wait for it to complete
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      refreshQueue.push({ resolve, reject, endpoint, options });
    });
  }

  isRefreshing = true;

  try {
    console.log('Attempting to refresh token...');
    // Attempt to refresh the token
    const refreshData = await refreshAuthToken();

    // Process all queued requests
    refreshQueue.forEach(({ resolve, reject, endpoint, options }) => {
      // Update Authorization header with new token
      if (options.headers) {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
                     sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          options.headers.Authorization = `Bearer ${token}`;
        }
      }

      // Retry the original request
      apiRequest(endpoint, options)
        .then(resolve)
        .catch(reject);
    });

    // Clear the queue
    refreshQueue = [];

    // Update Authorization header for current request
    if (options.headers) {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
                   sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        options.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Retry the current request
    return await apiRequest(endpoint, options);
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Token refresh failed, reject all queued requests
    refreshQueue.forEach(({ reject }) => {
      reject(new Error('Session expired. Please login again.'));
    });

    // Clear the queue
    refreshQueue = [];

    // Throw error for current request
    throw new Error('Session expired. Please login again.');
  } finally {
    isRefreshing = false;
  }
};

/**
 * Makes an API request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise} Response promise
 */
export const apiRequest = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, options);

    // Handle unauthorized responses (401)
    if (response.status === 401) {
      console.warn('Received 401 Unauthorized response');

      // Only attempt token refresh if this request included auth
      if (options.headers && options.headers.Authorization) {
        console.log('Request had Authorization header, attempting token refresh');
        return await handleTokenRefresh(endpoint, options);
      } else {
        // If no auth was included, just throw the error
        console.error('No Authorization header, cannot refresh token');
        throw new Error('Session expired. Please login again.');
      }
    }

    // Handle other error responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', {
        status: response.status,
        url: response.url,
        message: errorData.message || 'Unknown error'
      });
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    // Parse JSON response if content exists
    if (response.status !== 204) {
      return response.json();
    }

    return null;
  } catch (error) {
    // Re-throw the error for handling by the caller
    throw error;
  }
};

/**
 * GET request helper
 * @param {string} endpoint - API endpoint
 * @param {boolean} includeAuth - Whether to include authentication token
 * @returns {Promise} Response promise
 */
export const get = (endpoint, includeAuth = true) => {
  return apiRequest(endpoint, {
    method: 'GET',
    headers: createHeaders(includeAuth),
  });
};

/**
 * POST request helper
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @param {boolean} includeAuth - Whether to include authentication token
 * @returns {Promise} Response promise
 */
export const post = (endpoint, data, includeAuth = true) => {
  return apiRequest(endpoint, {
    method: 'POST',
    headers: createHeaders(includeAuth),
    body: JSON.stringify(data),
  });
};

/**
 * PUT request helper
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @param {boolean} includeAuth - Whether to include authentication token
 * @returns {Promise} Response promise
 */
export const put = (endpoint, data, includeAuth = true) => {
  return apiRequest(endpoint, {
    method: 'PUT',
    headers: createHeaders(includeAuth),
    body: JSON.stringify(data),
  });
};

/**
 * DELETE request helper
 * @param {string} endpoint - API endpoint
 * @param {boolean} includeAuth - Whether to include authentication token
 * @returns {Promise} Response promise
 */
export const del = (endpoint, includeAuth = true) => {
  return apiRequest(endpoint, {
    method: 'DELETE',
    headers: createHeaders(includeAuth),
  });
};

export default {
  get,
  post,
  put,
  del,
  createHeaders,
  apiRequest,
};

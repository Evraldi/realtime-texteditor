/**
 * API Service Configuration
 *
 * This file contains the configuration for API requests,
 * including base URL, headers, and interceptors.
 */

// Get the API base URL from environment variables or use relative URL
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || '';

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
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
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
      // Clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
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

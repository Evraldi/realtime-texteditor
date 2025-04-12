/**
 * Error handling utilities
 *
 * This file contains utilities for handling errors in the application.
 */

/**
 * Log error to console with additional context
 * @param {Error} error - Error object
 * @param {string} context - Context where the error occurred
 * @param {Object} additionalData - Additional data to log
 */
export const logError = (error, context = '', additionalData = {}) => {
  // In production, we might want to send this to a logging service
  if (process.env.NODE_ENV !== 'production') {
    console.error(
      `Error in ${context}:`,
      error.message || 'Unknown error',
      {
        stack: error.stack,
        ...additionalData,
      }
    );
  }
};

/**
 * Format API error message for display
 * @param {Error} error - Error object
 * @param {string} fallbackMessage - Fallback message if error doesn't have a message
 * @returns {string} Formatted error message
 */
export const formatApiError = (error, fallbackMessage = 'An error occurred') => {
  // If the error has a response from the server
  if (error.response && error.response.data) {
    const { data } = error.response;

    // If the server returned a message
    if (data.message) {
      return data.message;
    }

    // If the server returned validation errors
    if (data.errors && Array.isArray(data.errors)) {
      return data.errors.map(err => err.message || err).join(', ');
    }
  }

  // If the error has a message
  if (error.message) {
    // Don't expose detailed network errors to users
    if (error.message.includes('Network Error')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }

    return error.message;
  }

  // Fallback message
  return fallbackMessage;
};

/**
 * Handle common error scenarios
 * @param {Error} error - Error object
 * @param {Function} setError - Function to set error state
 * @param {string} context - Context where the error occurred
 */
export const handleError = (error, setError, context = '') => {
  logError(error, context);

  // Handle authentication errors
  if (error.response && error.response.status === 401) {
    // Clear token and redirect to login
    localStorage.removeItem('token');
    window.location.href = '/login';
    setError('Your session has expired. Please login again.');
    return;
  }

  // Handle server errors
  if (error.response && error.response.status >= 500) {
    setError('Server error. Please try again later.');
    return;
  }

  // Handle other errors
  setError(formatApiError(error));
};

export default {
  logError,
  formatApiError,
  handleError,
};

/**
 * Application constants
 */

// API URL - Use environment variable or default to localhost
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Socket URL - Use environment variable or default to localhost
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

// Default pagination limit
export const DEFAULT_LIMIT = 10;

// Maximum file size for uploads (in bytes)
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Supported file types for uploads
export const SUPPORTED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// Default avatar colors
export const AVATAR_COLORS = [
  '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e',
  '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#2c3e50',
  '#f1c40f', '#e67e22', '#e74c3c', '#ecf0f1', '#95a5a6',
  '#f39c12', '#d35400', '#c0392b', '#bdc3c7', '#7f8c8d'
];

// Debounce delay for search inputs (in milliseconds)
export const SEARCH_DEBOUNCE_DELAY = 300;

// Throttle delay for scroll events (in milliseconds)
export const SCROLL_THROTTLE_DELAY = 200;

// Autosave delay for document editing (in milliseconds)
export const AUTOSAVE_DELAY = 2000;

// Maximum length for document title
export const MAX_TITLE_LENGTH = 100;

// Maximum length for comments
export const MAX_COMMENT_LENGTH = 1000;

// Maximum length for replies
export const MAX_REPLY_LENGTH = 500;

// Document types
export const DOCUMENT_TYPES = {
  TEXT: 'text',
  SPREADSHEET: 'spreadsheet',
  PRESENTATION: 'presentation'
};

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

// Document permissions
export const DOCUMENT_PERMISSIONS = {
  OWNER: 'owner',
  EDITOR: 'editor',
  VIEWER: 'viewer'
};

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER: 'user_data',
  THEME: 'theme',
  RECENT_DOCUMENTS: 'recent_documents',
  EDITOR_PREFERENCES: 'editor_preferences'
};

// Theme options
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again later.',
  NETWORK: 'Network error. Please check your internet connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password.',
    ACCOUNT_LOCKED: 'Your account has been temporarily locked due to multiple failed login attempts.',
    SESSION_EXPIRED: 'Your session has expired. Please log in again.',
    WEAK_PASSWORD: 'Password is too weak. Please choose a stronger password.',
    EMAIL_IN_USE: 'This email is already in use.',
    INVALID_TOKEN: 'Invalid or expired token.'
  }
};

// Success messages
export const SUCCESS_MESSAGES = {
  DOCUMENT_SAVED: 'Document saved successfully.',
  DOCUMENT_SHARED: 'Document shared successfully.',
  COMMENT_ADDED: 'Comment added successfully.',
  SETTINGS_UPDATED: 'Settings updated successfully.',
  AUTH: {
    REGISTERED: 'Registration successful! You can now log in.',
    PASSWORD_RESET_REQUESTED: 'If your email is registered, you will receive password reset instructions.',
    PASSWORD_RESET: 'Your password has been reset successfully.',
    PROFILE_UPDATED: 'Your profile has been updated successfully.'
  }
};

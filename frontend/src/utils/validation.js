/**
 * Validation utilities for forms
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and message
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters' };
  }
  
  if (!/\d/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Calculate password strength score (0-100)
 * @param {string} password - Password to evaluate
 * @returns {number} Strength score
 */
export const getPasswordStrength = (password) => {
  if (!password) return 0;
  
  let score = 0;
  
  // Length contribution (up to 30 points)
  score += Math.min(password.length * 3, 30);
  
  // Character variety contribution (up to 70 points)
  if (/[a-z]/.test(password)) score += 10; // lowercase
  if (/[A-Z]/.test(password)) score += 15; // uppercase
  if (/\d/.test(password)) score += 15;    // numbers
  if (/[^a-zA-Z0-9]/.test(password)) score += 20; // special chars
  
  // Variety of character types
  const charTypes = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z0-9]/]
    .filter(regex => regex.test(password)).length;
  score += charTypes * 5;
  
  return Math.min(score, 100);
};

/**
 * Get password strength label based on score
 * @param {number} score - Password strength score
 * @returns {string} Strength label
 */
export const getPasswordStrengthLabel = (score) => {
  if (score < 30) return 'Very Weak';
  if (score < 50) return 'Weak';
  if (score < 70) return 'Moderate';
  if (score < 90) return 'Strong';
  return 'Very Strong';
};

/**
 * Get password strength color based on score
 * @param {number} score - Password strength score
 * @returns {string} CSS color value
 */
export const getPasswordStrengthColor = (score) => {
  if (score < 30) return '#ff4d4d'; // red
  if (score < 50) return '#ffaa00'; // orange
  if (score < 70) return '#ffdd00'; // yellow
  if (score < 90) return '#00cc44'; // light green
  return '#00aa44'; // dark green
};

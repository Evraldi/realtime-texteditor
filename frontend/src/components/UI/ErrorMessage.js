import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

/**
 * Error message component
 * @param {Object} props - Component props
 * @param {string} props.message - Error message
 * @param {string} props.type - Error type (error, warning, info, success)
 * @param {Function} props.onDismiss - Function to call when dismissed
 * @returns {JSX.Element} Error message component
 */
const ErrorMessage = ({ message, type = 'error', onDismiss }) => {
  if (!message) return null;

  // CSS classes based on type
  const alertClass = `alert alert-${type}`;

  // Check if this is a session expiration message
  const isSessionExpired = message && (
    message.includes('session expired') ||
    message.includes('Session expired') ||
    message.toLowerCase().includes('log in again')
  );

  return (
    <div className={alertClass} role="alert" data-testid="error-message">
      <div className="alert-content">
        <p className="alert-message">{message}</p>

        {isSessionExpired && (
          <div className="alert-actions">
            <Link to="/login" className="btn btn-sm btn-primary">
              Login Again
            </Link>
          </div>
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="alert-dismiss"
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
};

ErrorMessage.propTypes = {
  message: PropTypes.string,
  type: PropTypes.oneOf(['error', 'warning', 'info', 'success']),
  onDismiss: PropTypes.func,
};

export default ErrorMessage;

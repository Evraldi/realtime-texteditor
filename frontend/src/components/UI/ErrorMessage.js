import React from 'react';
import PropTypes from 'prop-types';

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

  return (
    <div className={alertClass} role="alert" data-testid="error-message">
      <p className="alert-message">{message}</p>
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

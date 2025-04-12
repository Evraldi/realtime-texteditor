import React from 'react';
import PropTypes from 'prop-types';

/**
 * Loading spinner component
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the spinner (small, medium, large)
 * @param {string} props.message - Message to display
 * @param {boolean} props.fullScreen - Whether to display full screen
 * @returns {JSX.Element} Loading component
 */
const Loading = ({ size = 'medium', message = 'Loading...', fullScreen = false }) => {
  // Determine spinner size class
  const spinnerSizeClass = size === 'small' ? 'spinner-sm' : size === 'large' ? 'spinner-lg' : '';

  // Determine container class
  const containerClass = `spinner-container ${fullScreen ? 'spinner-fullscreen' : ''}`;

  return (
    <div className={containerClass} data-testid="loading-spinner">
      <div className={`spinner ${spinnerSizeClass}`} />
      {message && <p className="spinner-text">{message}</p>}
    </div>
  );
};

Loading.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  message: PropTypes.string,
  fullScreen: PropTypes.bool,
};

export default Loading;

import React, { useState, useEffect } from 'react';
import TextEditor from '../components/Editor/TextEditor';
import Loading from '../components/UI/Loading';
import ErrorMessage from '../components/UI/ErrorMessage';

/**
 * Editor page component with responsive design and performance optimizations
 * @returns {JSX.Element} Editor page
 */
const EditorPage = () => {
  // State for responsive design and performance tracking
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionQuality, setConnectionQuality] = useState('good'); // 'good', 'fair', 'poor'

  // Detect mobile devices and screen size changes
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check initial screen size
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize);

    // Simulate loading completion
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    // Clean up
    return () => {
      window.removeEventListener('resize', checkScreenSize);
      clearTimeout(timer);
    };
  }, []);

  // Monitor connection quality
  useEffect(() => {
    const checkConnectionQuality = () => {
      // Use Navigator.connection API if available
      if ('connection' in navigator) {
        const connection = navigator.connection;

        if (connection.effectiveType === '4g') {
          setConnectionQuality('good');
        } else if (connection.effectiveType === '3g') {
          setConnectionQuality('fair');
        } else {
          setConnectionQuality('poor');
        }

        // Listen for connection changes
        connection.addEventListener('change', checkConnectionQuality);
      }
    };

    // Check initial connection quality
    checkConnectionQuality();

    // Clean up
    return () => {
      if ('connection' in navigator) {
        navigator.connection.removeEventListener('change', checkConnectionQuality);
      }
    };
  }, []);

  // Handle errors
  const handleError = (errorMessage) => {
    setError(errorMessage);
    setTimeout(() => setError(''), 5000);
  };

  // Show loading state
  if (isLoading) {
    return <Loading message="Preparing editor..." />;
  }

  return (
    <div className={`editor-page ${isMobile ? 'editor-page-mobile' : ''}`}>
      {/* Connection quality indicator */}
      {connectionQuality !== 'good' && (
        <div className={`connection-indicator connection-${connectionQuality}`}>
          {connectionQuality === 'fair' ?
            'Connection is slow. Some features may be delayed.' :
            'Poor connection. Changes may not sync immediately.'}
        </div>
      )}

      {/* Error message */}
      {error && (
        <ErrorMessage
          message={error}
          type="error"
          onDismiss={() => setError('')}
        />
      )}

      <div className="editor-content">
        <div className="editor-main">
          <TextEditor
            isMobile={isMobile}
            onError={handleError}
            connectionQuality={connectionQuality}
          />
        </div>
      </div>
    </div>
  );
};

export default EditorPage;

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from '../UI/Loading';

/**
 * PrivateRoute component for protecting routes that require authentication
 * @param {Object} props - Component props
 * @param {JSX.Element} props.children - Child components to render if authenticated
 * @returns {JSX.Element} Protected route component
 */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading indicator while checking authentication
  if (loading) {
    return (
      <div className="auth-loading-container">
        <Loading size="large" />
        <p>Verifying authentication...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the location they were trying to go to for a redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render children if authenticated
  return children;
};

export default PrivateRoute;

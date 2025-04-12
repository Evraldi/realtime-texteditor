import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ErrorMessage from '../UI/ErrorMessage';
import Loading from '../UI/Loading';
import { validateEmail } from '../../utils/validation';
import loginIllustration from '../../assets/login-illustration.svg';

/**
 * Login component
 * @returns {JSX.Element} Login form
 */
const Login = () => {
  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [formError, setFormError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Hooks
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error, isAuthenticated } = useAuth();

  // Check for redirect after login
  useEffect(() => {
    if (isAuthenticated) {
      const { from } = location.state || { from: { pathname: '/documents' } };
      navigate(from);
    }
  }, [isAuthenticated, navigate, location]);

  // Check for messages from other pages (like registration success)
  useEffect(() => {
    if (location.state?.message) {
      setFormError(location.state.message);
      // Clear the message from location state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  /**
   * Validate form fields
   * @returns {boolean} True if valid
   */
  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setFormError('');

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    }

    return isValid;
  };

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      await login(email, password, rememberMe);
      // Navigation is handled by the useEffect above
    } catch (err) {
      // Error is handled by the auth context
      // Focus the appropriate field based on the error
      if (err.message?.toLowerCase().includes('email')) {
        document.getElementById('email').focus();
      } else if (err.message?.toLowerCase().includes('password')) {
        document.getElementById('password').focus();
      }
    }
  };

  /**
   * Handle forgot password click
   */
  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <div className="auth-page">
      <div className="auth-form-container">
        <div className="auth-illustration">
          <img src={loginIllustration} alt="Login" />
        </div>
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>SignIn to continue to your account</p>
        </div>

        {/* Display errors */}
        {(error || formError) && (
          <ErrorMessage
            message={formError || error}
            onDismiss={() => {
              setFormError('');
              // Don't clear the context error here as it might be needed
            }}
          />
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className={`form-group ${emailError ? 'has-error' : ''}`}>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              onBlur={() => {
                if (email && !validateEmail(email)) {
                  setEmailError('Please enter a valid email address');
                }
              }}
              placeholder="Enter your email"
              disabled={loading}
              required
              className="form-control"
              aria-describedby="emailError"
            />
            {emailError && <div className="error-message" id="emailError">{emailError}</div>}
          </div>

          <div className={`form-group ${passwordError ? 'has-error' : ''}`}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
              placeholder="Enter your password"
              disabled={loading}
              required
              className="form-control"
              aria-describedby="passwordError"
            />
            {passwordError && <div className="error-message" id="passwordError">{passwordError}</div>}
          </div>

          <div className="form-group form-options">
            <div className="remember-me">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="rememberMe">Remember me</label>
            </div>
            <div className="forgot-password">
              <button
                type="button"
                className="btn-link"
                onClick={handleForgotPassword}
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-block"
            aria-busy={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {loading && <Loading size="small" />}

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

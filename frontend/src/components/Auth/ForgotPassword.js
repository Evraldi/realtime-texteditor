import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../../services/authService';
import { validateEmail } from '../../utils/validation';
import ErrorMessage from '../UI/ErrorMessage';
import Loading from '../UI/Loading';
import forgotPasswordIllustration from '../../assets/forgot-password-illustration.svg';

/**
 * ForgotPassword component
 * @returns {JSX.Element} Forgot password form
 */
const ForgotPassword = () => {
  // State
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Hooks
  const navigate = useNavigate();

  /**
   * Validate form fields
   * @returns {boolean} True if valid
   */
  const validateForm = () => {
    setEmailError('');
    setError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to process password reset request');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle back to login
   */
  const handleBackToLogin = () => {
    navigate('/login');
  };

  // Show success message if request was successful
  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-form-container">
          <div className="auth-illustration">
            <img src={forgotPasswordIllustration} alt="Forgot Password" />
          </div>
          <div className="auth-header">
            <h2>Check Your Email</h2>
            <p>We've sent password reset instructions to your email</p>
          </div>

          <div className="success-message">
            <p>
              If an account exists with the email <strong>{email}</strong>,
              you will receive an email with instructions on how to reset your password.
            </p>
            <p>Please check your inbox and spam folder.</p>
          </div>

          <button
            type="button"
            onClick={handleBackToLogin}
            className="btn btn-primary btn-block"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-form-container">
        <div className="auth-illustration">
          <img src={forgotPasswordIllustration} alt="Forgot Password" />
        </div>
        <div className="auth-header">
          <h2>Reset Password</h2>
          <p>Enter your email to receive password reset instructions</p>
        </div>

        {error && (
          <ErrorMessage
            message={error}
            onDismiss={() => setError('')}
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

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-block"
            aria-busy={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Instructions'}
          </button>
        </form>

        {loading && <Loading size="small" />}

        <div className="auth-footer">
          Remember your password? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

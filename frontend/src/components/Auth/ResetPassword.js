import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { resetPassword } from '../../services/authService';
import {
  validatePassword,
  getPasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor
} from '../../utils/validation';
import ErrorMessage from '../UI/ErrorMessage';
import Loading from '../UI/Loading';
import resetPasswordIllustration from '../../assets/login-illustration.svg';

/**
 * ResetPassword component
 * @returns {JSX.Element} Reset password form
 */
const ResetPassword = () => {
  // Get token from URL
  const { token } = useParams();

  // State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Hooks
  const navigate = useNavigate();

  // Update password strength when password changes
  useEffect(() => {
    setPasswordStrength(getPasswordStrength(password));
  }, [password]);

  /**
   * Validate form fields
   * @returns {boolean} True if valid
   */
  const validateForm = () => {
    let isValid = true;
    setPasswordError('');
    setConfirmPasswordError('');
    setError('');

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.message);
      isValid = false;
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
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

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
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

  // Show success message if password was reset
  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-form-container">
          <div className="auth-illustration">
            <img src={resetPasswordIllustration} alt="Reset Password" />
          </div>
          <div className="auth-header">
            <h2>Password Reset Successful</h2>
            <p>Your password has been updated</p>
          </div>

          <div className="success-message">
            <p>
              Your password has been successfully reset. You can now log in with your new password.
            </p>
          </div>

          <button
            type="button"
            onClick={handleBackToLogin}
            className="btn btn-primary btn-block"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-form-container">
        <div className="auth-illustration">
          <img src={resetPasswordIllustration} alt="Reset Password" />
        </div>
        <div className="auth-header">
          <h2>Reset Password</h2>
          <p>Create a new password for your account</p>
        </div>

        {error && (
          <ErrorMessage
            message={error}
            onDismiss={() => setError('')}
          />
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className={`form-group ${passwordError ? 'has-error' : ''}`}>
            <label htmlFor="password">New Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
              placeholder="Create a new password"
              disabled={loading}
              required
              className="form-control"
              aria-describedby="passwordError"
            />
            {passwordError && <div className="error-message" id="passwordError">{passwordError}</div>}

            {/* Password strength indicator */}
            {password && (
              <div className="password-strength">
                <div className="strength-bar-container">
                  <div
                    className="strength-bar"
                    style={{
                      width: `${passwordStrength}%`,
                      backgroundColor: getPasswordStrengthColor(passwordStrength)
                    }}
                  ></div>
                </div>
                <div className="strength-text">
                  Password strength: <span style={{ color: getPasswordStrengthColor(passwordStrength) }}>
                    {getPasswordStrengthLabel(passwordStrength)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className={`form-group ${confirmPasswordError ? 'has-error' : ''}`}>
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (confirmPasswordError) setConfirmPasswordError('');
              }}
              onBlur={() => {
                if (password && confirmPassword && password !== confirmPassword) {
                  setConfirmPasswordError('Passwords do not match');
                }
              }}
              placeholder="Confirm your new password"
              disabled={loading}
              required
              className="form-control"
              aria-describedby="confirmPasswordError"
            />
            {confirmPasswordError && <div className="error-message" id="confirmPasswordError">{confirmPasswordError}</div>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-block"
            aria-busy={loading}
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
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

export default ResetPassword;

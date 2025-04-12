import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../services/authService';
import ErrorMessage from '../UI/ErrorMessage';
import Loading from '../UI/Loading';
import {
  validateEmail,
  validatePassword,
  getPasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor
} from '../../utils/validation';
import registerIllustration from '../../assets/register-illustration.svg';

/**
 * Register component
 * @returns {JSX.Element} Registration form
 */
const Register = () => {
  // State
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Hooks
  const navigate = useNavigate();

  // Update password strength when password changes
  useEffect(() => {
    setPasswordStrength(getPasswordStrength(password));
  }, [password]);

  // Auto-generate username from email
  useEffect(() => {
    if (email && !username) {
      const emailUsername = email.split('@')[0];
      setUsername(emailUsername);
    }
  }, [email, username]);

  /**
   * Validate form fields
   * @returns {boolean} True if valid
   */
  const validateForm = () => {
    let isValid = true;

    // Reset all errors
    setEmailError('');
    setUsernameError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setFormError('');

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Validate username
    if (!username.trim()) {
      setUsernameError('Username is required');
      isValid = false;
    } else if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      isValid = false;
    }

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

    // Clear previous errors
    setFormError('');
    setError('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await register(email, password, username);
      navigate('/login', {
        state: { message: 'Registration successful. Please login with your new account.' }
      });
    } catch (err) {
      setError(err.message || 'Registration failed');

      // Focus the appropriate field based on the error message
      if (err.message?.toLowerCase().includes('email')) {
        document.getElementById('email').focus();
      } else if (err.message?.toLowerCase().includes('password')) {
        document.getElementById('password').focus();
      } else if (err.message?.toLowerCase().includes('username')) {
        document.getElementById('username').focus();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-form-container">
        <div className="auth-illustration">
          <img src={registerIllustration} alt="Register" />
        </div>
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Sign up to get started with Real-Time Editor</p>
        </div>

        {/* Display errors */}
        {(error || formError) && (
          <ErrorMessage
            message={formError || error}
            onDismiss={() => {
              setFormError('');
              setError('');
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

          <div className={`form-group ${usernameError ? 'has-error' : ''}`}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (usernameError) setUsernameError('');
              }}
              placeholder="Choose a username"
              disabled={loading}
              required
              className="form-control"
              aria-describedby="usernameError"
            />
            {usernameError && <div className="error-message" id="usernameError">{usernameError}</div>}
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
              placeholder="Create a password"
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
            <label htmlFor="confirmPassword">Confirm Password</label>
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
              placeholder="Confirm your password"
              disabled={loading}
              required
              className="form-control"
              aria-describedby="confirmPasswordError"
            />
            {confirmPasswordError && <div className="error-message" id="confirmPasswordError">{confirmPasswordError}</div>}
          </div>

          <div className="form-group terms-privacy">
            <p className="small-text">
              By creating an account, you agree to our <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-block"
            aria-busy={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {loading && <Loading size="small" />}

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

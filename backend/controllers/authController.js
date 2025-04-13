const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

/**
 * Generate JWT access token
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      username: user.username || user.email.split('@')[0]
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

/**
 * Generate refresh token
 * @param {Object} user - User object
 * @returns {string} Refresh token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user._id },
    process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Register a new user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, username } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    // Create new user (password will be hashed by pre-save hook)
    const newUser = new User({
      email,
      password,
      username: username || email.split('@')[0]
    });

    await newUser.save();

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Login user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.accountLocked) {
      if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
        const timeLeft = Math.ceil((user.accountLockedUntil - new Date()) / 1000 / 60);
        return res.status(403).json({
          message: `Account is locked. Try again in ${timeLeft} minutes.`
        });
      } else {
        // Reset lock if the lock period has expired
        user.accountLocked = false;
        user.failedLoginAttempts = 0;
        await user.save();
      }
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment failed login attempts
      const isLocked = await user.registerFailedLogin();
      if (isLocked) {
        return res.status(403).json({
          message: 'Too many failed login attempts. Account locked for 15 minutes.'
        });
      }
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Reset failed login attempts on successful login
    await user.resetFailedLoginAttempts();

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to user document
    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Send response with access token and user info
    res.json({
      token: accessToken,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        profileColor: user.profileColor
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Refresh access token using refresh token
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.refreshToken = async (req, res) => {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET
    );

    // Find user with matching refresh token
    const user = await User.findOne({
      _id: decoded.userId,
      refreshToken: refreshToken
    });

    if (!user) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Generate new tokens
    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    await user.save();

    // Set new refresh token as cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Send new access token
    res.json({ token: accessToken });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Invalid or expired refresh token' });
    }

    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Failed to refresh token' });
  }
};

/**
 * Logout user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.logout = async (req, res) => {
  try {
    // Clear refresh token from database
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
};

/**
 * Request password reset
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    // Don't reveal if user exists or not for security
    if (!user) {
      return res.status(200).json({
        message: 'If your email is registered, you will receive a password reset link'
      });
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetURL = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

    // In a real application, send email with reset URL
    // For now, just return the token in development mode
    if (process.env.NODE_ENV === 'development') {
      return res.status(200).json({
        message: 'Password reset token generated',
        resetURL,
        token: resetToken
      });
    }

    res.status(200).json({
      message: 'If your email is registered, you will receive a password reset link'
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Failed to process password reset request' });
  }
};

/**
 * Reset password using token
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Update password and clear reset token fields
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

/**
 * Get current user profile
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Failed to retrieve user profile' });
  }
};

const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getCurrentUser
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting for auth routes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: { message: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Registration validation
const registerValidation = [
  check('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  check('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/\d/)
    .withMessage('Password must contain a number')
];

// Login validation
const loginValidation = [
  check('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  check('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Password reset validation
const resetPasswordValidation = [
  check('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/\d/)
    .withMessage('Password must contain a number')
];

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, loginLimiter, login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPasswordValidation, resetPassword);

// Protected routes
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getCurrentUser);

module.exports = router;

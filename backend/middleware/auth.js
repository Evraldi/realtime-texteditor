const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to authenticate JWT token
 * Requires authentication for protected routes
 */
exports.authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Find user
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token - user not found' });
    }
    
    // Update user's last active timestamp
    await User.findByIdAndUpdate(user._id, { lastActive: new Date() });
    
    // Attach user to request object
    req.user = user;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    } else {
      console.error('Authentication error:', error);
      return res.status(500).json({ message: 'Authentication error' });
    }
  }
};

/**
 * Middleware for optional authentication
 * Allows both authenticated and unauthenticated access
 */
exports.optionalAuthToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
    
    if (!token) {
      // Continue without authentication
      return next();
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Find user
    const user = await User.findById(decoded.userId);
    
    if (user) {
      // Update user's last active timestamp
      await User.findByIdAndUpdate(user._id, { lastActive: new Date() });
      
      // Attach user to request object
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Continue without authentication on token error
    next();
  }
};

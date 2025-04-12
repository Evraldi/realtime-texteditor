const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');
const crypto = require('crypto');

/**
 * User schema with enhanced profile information
 */
const userSchema = new Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  refreshToken: {
    type: String,
    default: null
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  accountLocked: {
    type: Boolean,
    default: false
  },
  accountLockedUntil: Date,
  username: {
    type: String,
    trim: true,
    default: function() {
      // Default username is the part before @ in email
      return this.email ? this.email.split('@')[0] : '';
    }
  },
  displayName: {
    type: String,
    trim: true
  },
  profileColor: {
    type: String,
    default: function() {
      // Generate a random color from a predefined set
      const colors = [
        '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
        '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
        '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', '#FF5722'
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    }
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    fontSize: {
      type: Number,
      default: 14,
      min: 8,
      max: 24
    },
    autoSave: {
      type: Boolean,
      default: true
    },
    notifications: {
      type: Boolean,
      default: true
    }
  },
  recentDocuments: [{
    document: {
      type: Schema.Types.ObjectId,
      ref: 'Document'
    },
    lastAccessed: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for user's full name
userSchema.virtual('fullName').get(function() {
  return this.displayName || this.username || this.email.split('@')[0];
});

// Index for better performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) return next();

  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password along with the new salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare password method
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>} True if passwords match
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Generate password reset token
 * @returns {string} Reset token
 */
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Token expires in 1 hour
  this.passwordResetExpires = Date.now() + 3600000;

  return resetToken;
};

/**
 * Track failed login attempts
 * @returns {boolean} Whether account is now locked
 */
userSchema.methods.registerFailedLogin = async function() {
  this.failedLoginAttempts += 1;

  // Lock account after 5 failed attempts
  if (this.failedLoginAttempts >= 5) {
    this.accountLocked = true;
    // Lock for 15 minutes
    this.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
  }

  await this.save();
  return this.accountLocked;
};

/**
 * Reset failed login attempts
 */
userSchema.methods.resetFailedLoginAttempts = async function() {
  this.failedLoginAttempts = 0;
  this.accountLocked = false;
  this.accountLockedUntil = undefined;
  await this.save();
};

module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * User schema with enhanced profile information
 */
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
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

module.exports = mongoose.model('User', userSchema);

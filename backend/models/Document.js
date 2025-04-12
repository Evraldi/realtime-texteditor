const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schema for document comments
 */
const commentSchema = new Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Position information for the comment
  position: {
    // Index position in the document
    index: {
      type: Number,
      required: true
    },
    // Line number (0-based)
    line: {
      type: Number,
      required: true
    },
    // Character position in the line (0-based)
    ch: {
      type: Number,
      required: true
    },
    // Selected text that the comment refers to (optional)
    selectedText: {
      type: String,
      default: ''
    },
    // Selection range (if applicable)
    selection: {
      start: {
        line: Number,
        ch: Number
      },
      end: {
        line: Number,
        ch: Number
      }
    }
  },
  // Comment status
  status: {
    type: String,
    enum: ['open', 'resolved'],
    default: 'open'
  },
  replies: [{
    text: {
      type: String,
      required: true,
      trim: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Schema for document version history
 */
const versionSchema = new Schema({
  content: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true }); // Each version gets its own ID

/**
 * Schema for document sharing
 */
const shareSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  permission: {
    type: String,
    enum: ['view', 'edit'],
    default: 'view'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Main document schema
 */
const documentSchema = new Schema({
  title: {
    type: String,
    default: 'Untitled Document',
    trim: true
  },
  content: {
    type: String,
    default: '',
    trim: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  versions: [versionSchema],
  comments: [commentSchema],
  sharedWith: [shareSchema],
  lastActive: {
    type: Date,
    default: Date.now
  },
  // Current version number for tracking format changes
  currentVersion: {
    type: Number,
    default: 1
  },
  // Flag to indicate if the document has formatting
  hasFormatting: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for better performance
documentSchema.index({ content: 'text', title: 'text' });
documentSchema.index({ createdBy: 1 });
documentSchema.index({ 'sharedWith.user': 1 });
documentSchema.index({ isPublic: 1 });
documentSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Document', documentSchema);

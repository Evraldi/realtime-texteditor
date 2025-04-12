const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Reply schema for nested comments
 */
const replySchema = new Schema({
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
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Comment schema for document comments
 */
const commentSchema = new Schema({
  document: {
    type: Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
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
  position: {
    // Optional position in the document where the comment is attached
    index: Number, // Absolute position in the document
    line: Number,  // Line number (0-based)
    ch: Number,    // Character position in the line (0-based)
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
    },
    selectedText: String // The text that was selected when creating the comment
  },
  replies: [replySchema],
  isResolved: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
commentSchema.index({ document: 1, createdAt: -1 });
commentSchema.index({ user: 1 });
commentSchema.index({ isResolved: 1 });

module.exports = mongoose.model('Comment', commentSchema);

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Version schema for document version history
 */
const versionSchema = new Schema({
  document: {
    type: Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  content: {
    type: String,
    required: false, // Changed to false to allow empty content
    trim: true,
    default: '' // Default to empty string
  },
  title: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  versionNumber: {
    type: Number,
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  changes: {
    // Track what changed in this version
    addedChars: Number,
    removedChars: Number,
    changedLines: Number,
    addedLines: Number,
    removedLines: Number,
    modifiedLines: Number,
    addedWords: Number,
    removedWords: Number,
    modifiedWords: Number,
    changePercentage: Number,
    oldLength: Number,
    newLength: Number,
    oldLineCount: Number,
    newLineCount: Number,
    totalChangedLines: Number
  },
  metadata: {
    // Additional metadata about this version
    changePercentage: Number,
    timestamp: Date,
    contentLength: Number,
    lineCount: Number,
    isRestoration: Boolean,
    restoredFromVersion: Number,
    restoredFromId: Schema.Types.ObjectId,
    clientInfo: String,  // Client application info
    deviceInfo: String,  // Device information
    sessionId: String    // User session ID
  },
  tags: {
    // Tags for categorizing versions
    type: [String],
    default: []
  },
  isSignificant: {
    // Flag for important versions (e.g., milestones)
    type: Boolean,
    default: false
  },
  comment: {
    // Optional user comment about this version
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
versionSchema.index({ document: 1, versionNumber: -1 });
versionSchema.index({ document: 1, createdAt: -1 });
versionSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Version', versionSchema);

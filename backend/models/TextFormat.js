const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schema for text formatting
 * Stores formatting information for document content
 */
const formatRangeSchema = new Schema({
  // Start position of the format
  startPos: {
    line: {
      type: Number,
      required: true
    },
    ch: {
      type: Number,
      required: true
    }
  },
  // End position of the format
  endPos: {
    line: {
      type: Number,
      required: true
    },
    ch: {
      type: Number,
      required: true
    }
  },
  // Type of format (bold, italic, etc.)
  formatType: {
    type: String,
    enum: ['bold', 'italic', 'underline', 'heading1', 'heading2', 'heading3', 'bulletList', 'numberList', 'link', 'image', 'code'],
    required: true
  },
  // Additional data for certain format types (e.g. URL for links)
  formatData: {
    type: Schema.Types.Mixed,
    default: null
  },
  // User who applied the format
  appliedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  // When the format was applied
  appliedAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Main text format schema
 */
const textFormatSchema = new Schema({
  // Reference to the document
  document: {
    type: Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  // Array of format ranges
  formats: [formatRangeSchema],
  // Version of the document this format applies to
  documentVersion: {
    type: Number,
    default: 1
  },
  // Last updated timestamp
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
textFormatSchema.index({ document: 1 });
textFormatSchema.index({ 'formats.appliedBy': 1 });
textFormatSchema.index({ lastUpdated: -1 });

module.exports = mongoose.model('TextFormat', textFormatSchema);

const mongoose = require('mongoose');

// Schema for version history of documents
const versionSchema = new mongoose.Schema({
  content: { 
    type: String, 
    required: true, 
    trim: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
}, { _id: false }); // No _id field for the version schema

// Main document schema
const documentSchema = new mongoose.Schema({
  content: { 
    type: String, 
    default: '', 
    trim: true 
  },
  versions: [versionSchema]
}, { 
  timestamps: true, // Automatically add createdAt and updatedAt fields
  versionKey: false // Disable the __v field
});

// Optional: Add indexes for better performance
documentSchema.index({ content: 'text' }); // Example: full-text search on content

module.exports = mongoose.model('Document', documentSchema);

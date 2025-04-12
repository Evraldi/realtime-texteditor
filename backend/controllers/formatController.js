const mongoose = require('mongoose');
const Document = require('../models/Document');
const TextFormat = require('../models/TextFormat');

/**
 * Helper function to handle errors
 * @param {Error} error - Error object
 * @param {string} message - Error message
 * @param {Response} res - Express response object
 */
const handleError = (error, message, res) => {
  console.error(`${message}:`, error);
  res.status(500).json({ message: `${message}: ${error.message}` });
};

/**
 * Get all formats for a document
 */
exports.getFormats = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    // Validate document ID
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({ message: 'Invalid document ID' });
    }
    
    // Find the document to check if it exists and has formatting
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // If document has no formatting, return empty array
    if (!document.hasFormatting) {
      return res.status(200).json({ formats: [] });
    }
    
    // Find all formats for the document
    const textFormat = await TextFormat.findOne({ document: documentId })
      .populate('formats.appliedBy', 'username email displayName');
    
    if (!textFormat) {
      return res.status(200).json({ formats: [] });
    }
    
    return res.status(200).json(textFormat);
  } catch (error) {
    handleError(error, 'Error fetching formats', res);
  }
};

/**
 * Apply format to text
 */
exports.applyFormat = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { formatType, startPos, endPos, formatData } = req.body;
    const userId = req.user._id;
    
    // Validate document ID
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({ message: 'Invalid document ID' });
    }
    
    // Validate required fields
    if (!formatType || !startPos || !endPos) {
      return res.status(400).json({ message: 'Format type, start position, and end position are required' });
    }
    
    // Find the document
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check if user has permission to edit the document
    const canEdit = 
      (document.createdBy && document.createdBy.toString() === userId.toString()) ||
      document.sharedWith.some(share => 
        share.user.toString() === userId.toString() && share.permission === 'edit'
      );
    
    if (!canEdit) {
      return res.status(403).json({ message: 'Not authorized to edit this document' });
    }
    
    // Find or create text format for the document
    let textFormat = await TextFormat.findOne({ document: documentId });
    
    if (!textFormat) {
      textFormat = new TextFormat({
        document: documentId,
        formats: [],
        documentVersion: document.currentVersion
      });
    }
    
    // Create new format
    const newFormat = {
      startPos,
      endPos,
      formatType,
      formatData: formatData || null,
      appliedBy: userId,
      appliedAt: new Date()
    };
    
    // Add format to the array
    textFormat.formats.push(newFormat);
    textFormat.lastUpdated = new Date();
    
    // Update document to indicate it has formatting
    if (!document.hasFormatting) {
      document.hasFormatting = true;
      await document.save();
    }
    
    // Save text format
    await textFormat.save();
    
    // Populate user information before returning
    await textFormat.populate('formats.appliedBy', 'username email displayName');
    
    return res.status(200).json(textFormat);
  } catch (error) {
    handleError(error, 'Error applying format', res);
  }
};

/**
 * Remove format from text
 */
exports.removeFormat = async (req, res) => {
  try {
    const { documentId, formatId } = req.params;
    const userId = req.user._id;
    
    // Validate document ID and format ID
    if (!mongoose.Types.ObjectId.isValid(documentId) || !mongoose.Types.ObjectId.isValid(formatId)) {
      return res.status(400).json({ message: 'Invalid document ID or format ID' });
    }
    
    // Find the document
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check if user has permission to edit the document
    const canEdit = 
      (document.createdBy && document.createdBy.toString() === userId.toString()) ||
      document.sharedWith.some(share => 
        share.user.toString() === userId.toString() && share.permission === 'edit'
      );
    
    if (!canEdit) {
      return res.status(403).json({ message: 'Not authorized to edit this document' });
    }
    
    // Find text format for the document
    const textFormat = await TextFormat.findOne({ document: documentId });
    
    if (!textFormat) {
      return res.status(404).json({ message: 'Format not found' });
    }
    
    // Remove format from the array
    const formatIndex = textFormat.formats.findIndex(format => format._id.toString() === formatId);
    
    if (formatIndex === -1) {
      return res.status(404).json({ message: 'Format not found' });
    }
    
    textFormat.formats.splice(formatIndex, 1);
    textFormat.lastUpdated = new Date();
    
    // If no formats left, update document to indicate it has no formatting
    if (textFormat.formats.length === 0) {
      document.hasFormatting = false;
      await document.save();
    }
    
    // Save text format
    await textFormat.save();
    
    return res.status(200).json({ message: 'Format removed successfully' });
  } catch (error) {
    handleError(error, 'Error removing format', res);
  }
};

/**
 * Clear all formats for a document
 */
exports.clearFormats = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user._id;
    
    // Validate document ID
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({ message: 'Invalid document ID' });
    }
    
    // Find the document
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check if user has permission to edit the document
    const canEdit = 
      (document.createdBy && document.createdBy.toString() === userId.toString()) ||
      document.sharedWith.some(share => 
        share.user.toString() === userId.toString() && share.permission === 'edit'
      );
    
    if (!canEdit) {
      return res.status(403).json({ message: 'Not authorized to edit this document' });
    }
    
    // Remove all formats for the document
    await TextFormat.deleteOne({ document: documentId });
    
    // Update document to indicate it has no formatting
    document.hasFormatting = false;
    await document.save();
    
    return res.status(200).json({ message: 'All formats cleared successfully' });
  } catch (error) {
    handleError(error, 'Error clearing formats', res);
  }
};

/**
 * Update format version when document content changes
 * This is an internal function used by the document controller
 * @param {string} documentId - Document ID
 * @param {number} newVersion - New version number
 */
exports.updateFormatVersion = async (documentId, newVersion) => {
  try {
    // Find text format for the document
    const textFormat = await TextFormat.findOne({ document: documentId });
    
    if (textFormat) {
      textFormat.documentVersion = newVersion;
      await textFormat.save();
    }
    
    // Update document version
    await Document.findByIdAndUpdate(documentId, { currentVersion: newVersion });
    
    return true;
  } catch (error) {
    console.error('Error updating format version:', error);
    return false;
  }
};

const Version = require('../models/Version');
const Document = require('../models/Document');
const mongoose = require('mongoose');
const { handleError } = require('../utils/errorHandler');
const { calculateChanges, generateChangeDescription } = require('../utils/diffUtils');

/**
 * Get all versions of a document
 */
exports.getVersions = async (req, res) => {
  try {
    const { documentId } = req.params;

    // Validate document ID
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({ message: 'Invalid document ID' });
    }

    // Find all versions for the document and populate user information
    const versions = await Version.find({ document: documentId })
      .populate('createdBy', 'username email displayName')
      .sort({ versionNumber: -1 });

    return res.status(200).json(versions);
  } catch (error) {
    handleError(error, 'Error fetching versions', res);
  }
};

/**
 * Get a specific version of a document
 */
exports.getVersion = async (req, res) => {
  try {
    const { documentId, versionId } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(documentId) || !mongoose.Types.ObjectId.isValid(versionId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    // Find the version
    const version = await Version.findOne({
      _id: versionId,
      document: documentId
    }).populate('createdBy', 'username email displayName');

    if (!version) {
      return res.status(404).json({ message: 'Version not found' });
    }

    return res.status(200).json(version);
  } catch (error) {
    handleError(error, 'Error fetching version', res);
  }
};

/**
 * Create a new version of a document
 */
exports.createVersion = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { content, title, description } = req.body;
    const userId = req.user._id;

    // Validate document ID
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({ message: 'Invalid document ID' });
    }

    // Check if document exists
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Ensure content is valid
    const safeContent = content || '';
    const safeTitle = title || document.title || 'Untitled Document';

    // Get the latest version number
    const latestVersion = await Version.findOne({ document: documentId })
      .sort({ versionNumber: -1 });

    const versionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    // Calculate changes using improved diff utility
    const previousContent = latestVersion ? (latestVersion.content || '') : '';
    const changes = calculateChanges(previousContent, safeContent);

    // Generate automatic description if none provided
    const autoDescription = generateChangeDescription(changes);
    const versionDescription = description || `Version ${versionNumber}: ${autoDescription}`;

    // Create new version with enhanced metadata
    const newVersion = new Version({
      document: documentId,
      content: safeContent,
      title: safeTitle,
      description: versionDescription,
      versionNumber,
      createdBy: userId,
      changes,
      metadata: {
        changePercentage: changes.changePercentage,
        timestamp: new Date(),
        contentLength: safeContent.length,
        lineCount: changes.newLineCount
      }
    });

    try {
      await newVersion.save();
      console.log(`Created version ${versionNumber} for document ${documentId}`);

      // Populate user information before returning
      await newVersion.populate('createdBy', 'username email displayName');

      return res.status(201).json(newVersion);
    } catch (saveError) {
      console.error('Error saving version:', saveError);

      // If it's a validation error for content, try with an explicit empty string
      if (saveError.name === 'ValidationError' && saveError.errors && saveError.errors.content) {
        newVersion.content = '';
        await newVersion.save();
        await newVersion.populate('createdBy', 'username email displayName');
        return res.status(201).json(newVersion);
      } else {
        throw saveError; // Re-throw if it's not a content validation error
      }
    }
  } catch (error) {
    handleError(error, 'Error creating version', res);
  }
};

/**
 * Restore a document to a specific version
 */
/**
 * Compare two versions of a document
 */
exports.compareVersions = async (req, res) => {
  try {
    const { documentId, versionId1, versionId2 } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(documentId) ||
        !mongoose.Types.ObjectId.isValid(versionId1) ||
        !mongoose.Types.ObjectId.isValid(versionId2)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    // Find both versions
    const version1 = await Version.findOne({
      _id: versionId1,
      document: documentId
    });

    const version2 = await Version.findOne({
      _id: versionId2,
      document: documentId
    });

    if (!version1 || !version2) {
      return res.status(404).json({ message: 'One or both versions not found' });
    }

    // Calculate differences between the two versions
    const content1 = version1.content || '';
    const content2 = version2.content || '';
    const comparison = calculateChanges(content1, content2);

    // Add version metadata to the comparison
    const result = {
      comparison,
      version1: {
        _id: version1._id,
        versionNumber: version1.versionNumber,
        createdAt: version1.createdAt,
        description: version1.description
      },
      version2: {
        _id: version2._id,
        versionNumber: version2.versionNumber,
        createdAt: version2.createdAt,
        description: version2.description
      },
      summary: generateChangeDescription(comparison)
    };

    return res.status(200).json(result);
  } catch (error) {
    handleError(error, 'Error comparing versions', res);
  }
};

/**
 * Restore a document to a specific version
 */
exports.restoreVersion = async (req, res) => {
  try {
    const { documentId, versionId } = req.params;
    const userId = req.user._id;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(documentId) || !mongoose.Types.ObjectId.isValid(versionId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    // Find the version
    const version = await Version.findOne({
      _id: versionId,
      document: documentId
    });

    if (!version) {
      return res.status(404).json({ message: 'Version not found' });
    }

    // Find the document
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user has permission to edit the document
    if (document.createdBy && document.createdBy.toString() !== userId.toString()) {
      // Check if user is in sharedWith with edit permission
      const sharedUser = document.sharedWith.find(
        share => share.user.toString() === userId.toString() && share.permission === 'edit'
      );

      if (!sharedUser) {
        return res.status(403).json({ message: 'Not authorized to restore this document' });
      }
    }

    // Update document content with version content
    document.content = version.content || '';
    if (version.title) document.title = version.title;

    // Save the document
    await document.save();

    try {
      // Create a new version to record the restoration
      const latestVersion = await Version.findOne({ document: documentId })
        .sort({ versionNumber: -1 });

      const versionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

      // Ensure content is valid
      const safeContent = version.content || '';
      const safeTitle = version.title || document.title || 'Untitled Document';

      // Calculate changes between current document and restored version
      const currentContent = document.content || '';
      const changes = calculateChanges(currentContent, safeContent);

      // Create restoration version with enhanced metadata
      const newVersion = new Version({
        document: documentId,
        content: safeContent,
        title: safeTitle,
        description: `Restored to version ${version.versionNumber}`,
        versionNumber,
        createdBy: userId,
        changes,
        metadata: {
          isRestoration: true,
          restoredFromVersion: version.versionNumber,
          restoredFromId: version._id,
          changePercentage: changes.changePercentage,
          timestamp: new Date(),
          contentLength: safeContent.length,
          lineCount: changes.newLineCount
        },
        tags: ['restoration']
      });

      await newVersion.save();
      console.log(`Created restoration version ${versionNumber} for document ${documentId}`);
    } catch (versionError) {
      console.error('Error creating restoration version:', versionError);
      // Continue without creating a version - don't fail the whole restoration
    }

    return res.status(200).json({
      message: 'Document restored successfully',
      document
      // Don't include version in response if it failed to create
    });
  } catch (error) {
    handleError(error, 'Error restoring version', res);
  }
};



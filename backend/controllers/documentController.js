const mongoose = require('mongoose');
const Document = require('../models/Document');
const Version = require('../models/Version');
const User = require('../models/User');
const TextFormat = require('../models/TextFormat');
const { handleError } = require('../utils/errorHandler');
const { updateFormatVersion } = require('./formatController');

/**
 * Get a single document by ID
 */
exports.getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user._id : null;

    // Validate document ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: `Invalid document ID: ${id}` });
    }

    // Find the document
    const document = await Document.findById(id)
      .populate('createdBy', 'username email displayName')
      .populate('sharedWith.user', 'username email displayName');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user has permission to access the document
    if (userId) {
      const canAccess =
        document.isPublic ||
        (document.createdBy && document.createdBy._id.toString() === userId.toString()) ||
        document.sharedWith.some(share => share.user._id.toString() === userId.toString());

      if (!canAccess) {
        return res.status(403).json({ message: 'Not authorized to access this document' });
      }

      // Update user's recent documents
      await User.findByIdAndUpdate(userId, {
        $pull: { recentDocuments: { document: id } }
      });

      await User.findByIdAndUpdate(userId, {
        $push: {
          recentDocuments: {
            $each: [{ document: id, lastAccessed: new Date() }],
            $position: 0,
            $slice: 10 // Keep only the 10 most recent documents
          }
        }
      });
    } else {
      // If no user is logged in, only allow access to public documents
      if (!document.isPublic) {
        return res.status(403).json({ message: 'Not authorized to access this document' });
      }
    }

    res.json(document);
  } catch (error) {
    handleError(error, 'Error fetching document', res);
  }
};

/**
 * Save a document (create or update)
 */
exports.saveDocument = async (req, res) => {
  try {
    const { id, content = '', title, isPublic } = req.body;
    const userId = req.user ? req.user._id : null;

    // Validate document ID if provided
    if (id && !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: `Invalid document ID: ${id}` });
    }

    let document;

    if (id) {
      // Update existing document
      document = await Document.findById(id);

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      // Check if user has permission to edit the document
      if (userId) {
        const canEdit =
          (document.createdBy && document.createdBy.toString() === userId.toString()) ||
          document.sharedWith.some(share =>
            share.user.toString() === userId.toString() && share.permission === 'edit'
          );

        if (!canEdit) {
          return res.status(403).json({ message: 'Not authorized to edit this document' });
        }
      } else if (!document.isPublic) {
        return res.status(403).json({ message: 'Not authorized to edit this document' });
      }

      // Update document fields
      if (content !== undefined) {
        // Ensure content is at least an empty string
        document.content = content || '';
      }
      if (title !== undefined) {
        document.title = title || 'Untitled Document';
      }
      if (isPublic !== undefined && userId && document.createdBy &&
          document.createdBy.toString() === userId.toString()) {
        document.isPublic = isPublic;
      }

      // Update lastActive timestamp
      document.lastActive = new Date();

      await document.save();

      // Create a new version if content changed significantly
      if (content !== undefined && userId) {
        try {
          // Get the latest version
          const latestVersion = await Version.findOne({ document: id })
            .sort({ versionNumber: -1 });

          // Only create a new version if content has changed significantly
          // or if it's been more than 1 minutes since the last version
          const safeContent = content || ''; // Ensure content is at least an empty string
          const previousContent = latestVersion ? (latestVersion.content || '') : '';
          const contentChanged = !latestVersion || previousContent !== safeContent;
          const timeThreshold = 1 * 60 * 1000; // 1 minutes in milliseconds
          const timeSinceLastVersion = latestVersion ?
            Date.now() - new Date(latestVersion.createdAt).getTime() :
            timeThreshold + 1;

          if (contentChanged && timeSinceLastVersion > timeThreshold) {
            const versionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

            // Calculate changes
            const changes = calculateChanges(previousContent, safeContent);

            // Only create a version if there are significant changes
            if (changes.changedLines > 0 || changes.addedChars > 10 || changes.removedChars > 10) {
              const newVersion = new Version({
                document: id,
                content: safeContent,
                title: document.title || 'Untitled Document',
                description: `Update ${new Date().toLocaleString()}`,
                versionNumber,
                createdBy: userId,
                changes
              });

              await newVersion.save();
              console.log(`Created new version ${versionNumber} for document ${id}`);

              // Update document version number
              document.currentVersion = versionNumber;
              await document.save();

              // Update format version if document has formatting
              if (document.hasFormatting) {
                await updateFormatVersion(id, versionNumber);
              }
            }
          }
        } catch (versionError) {
          console.error('Error creating version:', versionError);
          // Continue without creating a version - don't fail the whole save operation
        }
      }
    } else {
      // Create new document
      if (!userId) {
        return res.status(403).json({ message: 'Authentication required to create documents' });
      }

      // Ensure content and title are valid
      const safeContent = content || '';
      const safeTitle = title || 'Untitled Document';

      document = new Document({
        title: safeTitle,
        content: safeContent,
        createdBy: userId,
        isPublic: isPublic || false,
        currentVersion: 1 // Set initial version number
      });

      await document.save();

      try {
        // Create initial version
        const initialVersion = new Version({
          document: document._id,
          content: safeContent,
          title: safeTitle,
          description: 'Initial version',
          versionNumber: 1,
          createdBy: userId,
          changes: {
            addedChars: safeContent.length,
            removedChars: 0,
            changedLines: safeContent.split('\n').length
          }
        });

        await initialVersion.save();
        console.log(`Created initial version for document ${document._id}`);

        // Create empty format document for future formatting
        const textFormat = new TextFormat({
          document: document._id,
          formats: [],
          documentVersion: 1,
          lastUpdated: new Date()
        });

        await textFormat.save();
      } catch (versionError) {
        console.error('Error creating initial version:', versionError);
        // Continue without creating a version - don't fail the whole document creation
      }

      // Add to user's recent documents
      await User.findByIdAndUpdate(userId, {
        $push: {
          recentDocuments: {
            $each: [{ document: document._id, lastAccessed: new Date() }],
            $position: 0
          }
        }
      });
    }

    // Populate fields before returning
    await document.populate('createdBy', 'username email displayName');
    await document.populate('sharedWith.user', 'username email displayName');

    res.status(200).json(document);
  } catch (error) {
    handleError(error, 'Error saving document', res);
  }
};

/**
 * Helper function to calculate changes between two versions
 */
function calculateChanges(oldContent, newContent) {
  // Simple implementation - in a real app, you'd use a diff algorithm
  const oldLength = oldContent.length;
  const newLength = newContent.length;

  const addedChars = Math.max(0, newLength - oldLength);
  const removedChars = Math.max(0, oldLength - newLength);

  // Count changed lines (simplified)
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  let changedLines = 0;

  const minLines = Math.min(oldLines.length, newLines.length);
  for (let i = 0; i < minLines; i++) {
    if (oldLines[i] !== newLines[i]) {
      changedLines++;
    }
  }

  // Add lines that were added or removed
  changedLines += Math.abs(oldLines.length - newLines.length);

  return {
    addedChars,
    removedChars,
    changedLines
  };
}

/**
 * Get all documents for the current user
 */
exports.getDocuments = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;

    let query = {};

    if (userId) {
      // If user is logged in, find documents created by the user or shared with the user
      query = {
        $or: [
          { createdBy: userId },
          { 'sharedWith.user': userId },
          { isPublic: true }
        ]
      };
    } else {
      // If no user is logged in, only show public documents
      query = { isPublic: true };
    }

    const documents = await Document.find(query)
      .populate('createdBy', 'username email displayName')
      .populate('sharedWith.user', 'username email displayName')
      .sort({ updatedAt: -1 });

    res.json(documents);
  } catch (error) {
    handleError(error, 'Error fetching documents', res);
  }
};

/**
 * Share a document with another user
 */
exports.shareDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, permission } = req.body;
    const userId = req.user ? req.user._id : null;

    if (!userId) {
      return res.status(403).json({ message: 'Authentication required' });
    }

    // Validate inputs
    if (!email || !permission) {
      return res.status(400).json({ message: 'Email and permission are required' });
    }

    if (!['view', 'edit'].includes(permission)) {
      return res.status(400).json({ message: 'Invalid permission. Must be "view" or "edit"' });
    }

    // Find the document
    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user is the document owner
    if (!document.createdBy || document.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to share this document' });
    }

    // Find the user to share with
    const userToShare = await User.findOne({ email: email.toLowerCase() });

    if (!userToShare) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't share with the owner
    if (userToShare._id.toString() === userId.toString()) {
      return res.status(400).json({ message: 'Cannot share document with yourself' });
    }

    // Check if already shared with this user
    const existingShare = document.sharedWith.find(
      share => share.user && share.user.toString() === userToShare._id.toString()
    );

    if (existingShare) {
      // Update existing share permission
      existingShare.permission = permission;
    } else {
      // Add new share
      document.sharedWith.push({
        user: userToShare._id,
        permission
      });
    }

    await document.save();

    // Populate fields before returning
    await document.populate('sharedWith.user', 'username email displayName');

    res.status(200).json({
      message: `Document shared with ${email} successfully`,
      document
    });
  } catch (error) {
    handleError(error, 'Error sharing document', res);
  }
};

/**
 * Remove share access for a user
 */
exports.removeShare = async (req, res) => {
  try {
    const { id, shareId } = req.params;
    const userId = req.user ? req.user._id : null;

    if (!userId) {
      return res.status(403).json({ message: 'Authentication required' });
    }

    // Find the document
    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user is the document owner
    if (!document.createdBy || document.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify sharing for this document' });
    }

    // Remove the share
    document.sharedWith = document.sharedWith.filter(
      share => share._id.toString() !== shareId
    );

    await document.save();

    res.status(200).json({
      message: 'Share access removed successfully',
      document
    });
  } catch (error) {
    handleError(error, 'Error removing share access', res);
  }
};

/**
 * Delete a document
 */
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user._id : null;

    if (!userId) {
      return res.status(403).json({ message: 'Authentication required' });
    }

    // Validate document ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: `Invalid document ID: ${id}` });
    }

    // Find the document
    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user is the document owner
    if (!document.createdBy || document.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this document' });
    }

    // Delete the document
    await Document.findByIdAndDelete(id);

    // Delete all versions of the document
    await Version.deleteMany({ document: id });

    // Remove from users' recent documents
    await User.updateMany(
      { 'recentDocuments.document': id },
      { $pull: { recentDocuments: { document: id } } }
    );

    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    handleError(error, 'Error deleting document', res);
  }
};

const express = require('express');
const router = express.Router();
const versionController = require('../controllers/versionController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all versions of a document
router.get('/document/:documentId', versionController.getVersions);

// Get a specific version
router.get('/document/:documentId/version/:versionId', versionController.getVersion);

// Compare two versions
router.get('/document/:documentId/compare/:versionId1/:versionId2', versionController.compareVersions);

// Create a new version
router.post('/document/:documentId', versionController.createVersion);

// Restore a document to a specific version
router.post('/document/:documentId/restore/:versionId', versionController.restoreVersion);

// Tag a version (mark as significant)
router.patch('/document/:documentId/version/:versionId/tag', async (req, res) => {
  try {
    const { documentId, versionId } = req.params;
    const { tags, isSignificant, comment } = req.body;
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

    // Update version tags and metadata
    if (tags && Array.isArray(tags)) {
      version.tags = [...new Set([...version.tags || [], ...tags])];
    }

    if (typeof isSignificant === 'boolean') {
      version.isSignificant = isSignificant;
    }

    if (comment) {
      version.comment = comment;
    }

    await version.save();

    return res.status(200).json({
      message: 'Version updated successfully',
      version
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error updating version',
      error: error.message
    });
  }
});

module.exports = router;

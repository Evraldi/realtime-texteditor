const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { authenticateToken, optionalAuthToken } = require('../middleware/auth');

// Routes that work with or without authentication
router.get('/document/:id', optionalAuthToken, documentController.getDocumentById);
router.get('/documents', optionalAuthToken, documentController.getDocuments);

// Routes that require authentication
router.post('/document', authenticateToken, documentController.saveDocument);
router.delete('/document/:id', authenticateToken, documentController.deleteDocument);

// Sharing routes
router.post('/document/:id/share', authenticateToken, documentController.shareDocument);
router.delete('/document/:id/share/:shareId', authenticateToken, documentController.removeShare);

module.exports = router;

const express = require('express');
const router = express.Router();
const formatController = require('../controllers/formatController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all formats for a document
router.get('/document/:documentId', formatController.getFormats);

// Apply format to text
router.post('/document/:documentId', formatController.applyFormat);

// Remove format from text
router.delete('/document/:documentId/format/:formatId', formatController.removeFormat);

// Clear all formats for a document
router.delete('/document/:documentId', formatController.clearFormats);

module.exports = router;

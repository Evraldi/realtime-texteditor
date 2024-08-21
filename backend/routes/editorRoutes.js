const express = require('express');
const router = express.Router();
const editorController = require('../controllers/editorController');

// Route to get a document by ID
router.get('/document/:id', editorController.getDocumentById);

// Route to save or update a document
router.post('/document', editorController.saveDocument);

module.exports = router;

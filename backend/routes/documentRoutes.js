const express = require('express');
const router = express.Router();
const { getDocumentById, saveDocument, getDocuments } = require('../controllers/documentController');

router.get('/document/:id', getDocumentById);
router.post('/document', saveDocument);
router.get('/documents', getDocuments);

module.exports = router;

const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all comments for a document
router.get('/document/:documentId', commentController.getComments);

// Create a new comment
router.post('/document/:documentId', commentController.createComment);

// Update a comment
router.put('/:commentId', commentController.updateComment);

// Delete a comment
router.delete('/:commentId', commentController.deleteComment);

// Add a reply to a comment
router.post('/:commentId/replies', commentController.addReply);

// Update a reply
router.put('/:commentId/replies/:replyId', commentController.updateReply);

// Delete a reply
router.delete('/:commentId/replies/:replyId', commentController.deleteReply);

module.exports = router;

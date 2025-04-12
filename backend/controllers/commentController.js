const Comment = require('../models/Comment');
const Document = require('../models/Document');
const mongoose = require('mongoose');
const { handleError } = require('../utils/errorHandler');

/**
 * Get all comments for a document
 */
exports.getComments = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    // Validate document ID
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({ message: 'Invalid document ID' });
    }
    
    // Find all comments for the document and populate user information
    const comments = await Comment.find({ document: documentId })
      .populate('user', 'username email displayName profileColor')
      .populate('replies.user', 'username email displayName profileColor')
      .sort({ createdAt: -1 });
    
    return res.status(200).json(comments);
  } catch (error) {
    handleError(error, 'Error fetching comments', res);
  }
};

/**
 * Create a new comment
 */
exports.createComment = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { text, position } = req.body;
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
    
    // Create new comment
    const newComment = new Comment({
      document: documentId,
      text,
      user: userId,
      position: position || null
    });
    
    await newComment.save();
    
    // Populate user information before returning
    await newComment.populate('user', 'username email displayName profileColor');
    
    return res.status(201).json(newComment);
  } catch (error) {
    handleError(error, 'Error creating comment', res);
  }
};

/**
 * Add a reply to a comment
 */
exports.addReply = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;
    
    // Validate comment ID
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }
    
    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Add reply to comment
    const reply = {
      text,
      user: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    comment.replies.push(reply);
    await comment.save();
    
    // Populate user information for the new reply
    await comment.populate('replies.user', 'username email displayName profileColor');
    
    // Return only the new reply
    const newReply = comment.replies[comment.replies.length - 1];
    
    return res.status(201).json(newReply);
  } catch (error) {
    handleError(error, 'Error adding reply', res);
  }
};

/**
 * Update a comment
 */
exports.updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text, isResolved } = req.body;
    const userId = req.user._id;
    
    // Validate comment ID
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }
    
    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if user is the comment owner
    if (comment.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this comment' });
    }
    
    // Update comment
    if (text) comment.text = text;
    if (isResolved !== undefined) comment.isResolved = isResolved;
    comment.updatedAt = new Date();
    
    await comment.save();
    
    // Populate user information before returning
    await comment.populate('user', 'username email displayName profileColor');
    await comment.populate('replies.user', 'username email displayName profileColor');
    
    return res.status(200).json(comment);
  } catch (error) {
    handleError(error, 'Error updating comment', res);
  }
};

/**
 * Update a reply
 */
exports.updateReply = async (req, res) => {
  try {
    const { commentId, replyId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;
    
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(commentId) || !mongoose.Types.ObjectId.isValid(replyId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }
    
    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Find the reply
    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }
    
    // Check if user is the reply owner
    if (reply.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this reply' });
    }
    
    // Update reply
    reply.text = text;
    reply.updatedAt = new Date();
    
    await comment.save();
    
    // Populate user information before returning
    await comment.populate('replies.user', 'username email displayName profileColor');
    
    return res.status(200).json(reply);
  } catch (error) {
    handleError(error, 'Error updating reply', res);
  }
};

/**
 * Delete a comment
 */
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;
    
    // Validate comment ID
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }
    
    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if user is the comment owner
    if (comment.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }
    
    // Delete comment
    await Comment.findByIdAndDelete(commentId);
    
    return res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    handleError(error, 'Error deleting comment', res);
  }
};

/**
 * Delete a reply
 */
exports.deleteReply = async (req, res) => {
  try {
    const { commentId, replyId } = req.params;
    const userId = req.user._id;
    
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(commentId) || !mongoose.Types.ObjectId.isValid(replyId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }
    
    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Find the reply
    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }
    
    // Check if user is the reply owner
    if (reply.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this reply' });
    }
    
    // Remove reply from comment
    comment.replies.pull(replyId);
    await comment.save();
    
    return res.status(200).json({ message: 'Reply deleted successfully' });
  } catch (error) {
    handleError(error, 'Error deleting reply', res);
  }
};

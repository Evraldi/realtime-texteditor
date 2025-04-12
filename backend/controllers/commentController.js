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

    console.log(`Backend: Adding reply to comment ${commentId} with text: ${text}`);

    // Validate comment ID
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }

    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    console.log('Backend: Original comment:', comment);

    // Add reply to comment
    const reply = {
      _id: new mongoose.Types.ObjectId(), // Explicitly generate an ID for the reply
      text,
      user: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    comment.replies.push(reply);
    await comment.save();

    // Populate user information for all replies
    await comment.populate('user', 'username email displayName profileColor');
    await comment.populate('replies.user', 'username email displayName profileColor');

    console.log('Backend: Updated comment with reply:', comment);

    // Return the entire updated comment with all replies
    return res.status(201).json(comment);
  } catch (error) {
    console.error('Backend: Error adding reply:', error);
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

    // Find the document to check if user is the document owner
    console.log('Comment document ID:', comment.document);
    console.log('User ID:', userId);

    let document;
    try {
      document = await Document.findById(comment.document);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      console.log('Document found:', document._id);
      console.log('Document createdBy:', document.createdBy);
    } catch (docError) {
      console.error('Error finding document:', docError);
      return res.status(500).json({ message: 'Error finding document' });
    }

    // Check permissions based on the update type
    const isCommentOwner = comment.user && comment.user.toString() === userId.toString();
    const isDocumentOwner = document.createdBy && document.createdBy.toString() === userId.toString();

    console.log('Is comment owner:', isCommentOwner);
    console.log('Is document owner:', isDocumentOwner);

    // For text updates, only the comment owner can edit
    if (text && !isCommentOwner) {
      return res.status(403).json({ message: 'Only the comment author can edit the text' });
    }

    // For isResolved updates, both comment owner and document owner can change
    if (isResolved !== undefined && !isCommentOwner && !isDocumentOwner) {
      return res.status(403).json({ message: 'Not authorized to resolve/unresolve this comment' });
    }

    // Update comment
    if (text) comment.text = text;
    if (isResolved !== undefined) {
      comment.isResolved = isResolved;
      console.log(`Comment ${commentId} ${isResolved ? 'resolved' : 'unresolved'} by ${isCommentOwner ? 'comment owner' : 'document owner'}`);
    }
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

    // Find the document to check if user is the document owner
    const document = await Document.findById(comment.document);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user is the reply owner
    // Note: For replies, only the author can edit the text (document owner can only delete)
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

    // Find the document to check if user is the document owner
    console.log('Comment document ID for delete:', comment.document);
    console.log('User ID for delete:', userId);

    let document;
    try {
      document = await Document.findById(comment.document);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      console.log('Document found for delete:', document._id);
      console.log('Document createdBy for delete:', document.createdBy);
    } catch (docError) {
      console.error('Error finding document for delete:', docError);
      return res.status(500).json({ message: 'Error finding document' });
    }

    // Check if user is the comment owner or document owner
    const isCommentOwner = comment.user && comment.user.toString() === userId.toString();
    const isDocumentOwner = document.createdBy && document.createdBy.toString() === userId.toString();

    console.log('Is comment owner for delete:', isCommentOwner);
    console.log('Is document owner for delete:', isDocumentOwner);

    if (!isCommentOwner && !isDocumentOwner) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Log who is deleting the comment
    console.log(`Comment ${commentId} deleted by ${isCommentOwner ? 'comment owner' : 'document owner'}`);

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

    // Find the document to check if user is the document owner
    console.log('Comment document ID for delete reply:', comment.document);
    console.log('User ID for delete reply:', userId);

    let document;
    try {
      document = await Document.findById(comment.document);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      console.log('Document found for delete reply:', document._id);
      console.log('Document createdBy for delete reply:', document.createdBy);
    } catch (docError) {
      console.error('Error finding document for delete reply:', docError);
      return res.status(500).json({ message: 'Error finding document' });
    }

    // Check if user is the reply owner or document owner
    const isReplyOwner = reply.user && reply.user.toString() === userId.toString();
    const isDocumentOwner = document.createdBy && document.createdBy.toString() === userId.toString();

    console.log('Is reply owner for delete:', isReplyOwner);
    console.log('Is document owner for delete:', isDocumentOwner);

    if (!isReplyOwner && !isDocumentOwner) {
      return res.status(403).json({ message: 'Not authorized to delete this reply' });
    }

    // Log who is deleting the reply
    console.log(`Reply ${replyId} deleted by ${isReplyOwner ? 'reply owner' : 'document owner'}`);

    // Remove reply from comment
    comment.replies.pull(replyId);
    await comment.save();

    return res.status(200).json({ message: 'Reply deleted successfully' });
  } catch (error) {
    handleError(error, 'Error deleting reply', res);
  }
};

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getRelativeTimeString } from '../../utils/dateUtils';

/**
 * CommentSystem component for adding and viewing comments on documents
 */
const CommentSystem = ({ documentId, userId, userName, isOpen, onClose }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyTo, setReplyTo] = useState(null);

  // Fetch comments when opened
  useEffect(() => {
    if (isOpen && documentId) {
      fetchComments();
    }
  }, [isOpen, documentId]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // This would be replaced with an actual API call
      // For now, we'll use mock data
      const mockComments = [
        {
          _id: 'c1',
          text: 'This section needs more details.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          user: { _id: 'user1', name: 'John Doe' },
          replies: [
            {
              _id: 'r1',
              text: 'I agree, I will add more information.',
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
              user: { _id: 'user2', name: 'Jane Smith' }
            }
          ]
        },
        {
          _id: 'c2',
          text: 'Great work on this document!',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          user: { _id: 'user3', name: 'Bob Johnson' },
          replies: []
        }
      ];
      
      setComments(mockComments);
    } catch (err) {
      setError('Failed to load comments');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    try {
      // This would be replaced with an actual API call
      const newCommentObj = {
        _id: `c${Date.now()}`,
        text: newComment,
        createdAt: new Date().toISOString(),
        user: { _id: userId, name: userName || 'You' },
        replies: []
      };
      
      if (replyTo) {
        // Add reply to existing comment
        setComments(prevComments => 
          prevComments.map(comment => 
            comment._id === replyTo._id 
              ? {
                  ...comment,
                  replies: [
                    ...comment.replies,
                    {
                      _id: `r${Date.now()}`,
                      text: newComment,
                      createdAt: new Date().toISOString(),
                      user: { _id: userId, name: userName || 'You' }
                    }
                  ]
                }
              : comment
          )
        );
        setReplyTo(null);
      } else {
        // Add new top-level comment
        setComments(prevComments => [...prevComments, newCommentObj]);
      }
      
      setNewComment('');
    } catch (err) {
      setError('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId, replyId = null) => {
    try {
      // This would be replaced with an actual API call
      if (replyId) {
        // Delete reply
        setComments(prevComments => 
          prevComments.map(comment => 
            comment._id === commentId 
              ? {
                  ...comment,
                  replies: comment.replies.filter(reply => reply._id !== replyId)
                }
              : comment
          )
        );
      } else {
        // Delete comment
        setComments(prevComments => 
          prevComments.filter(comment => comment._id !== commentId)
        );
      }
    } catch (err) {
      setError('Failed to delete comment');
    }
  };

  const handleReply = (comment) => {
    setReplyTo(comment);
    // Focus the comment input
    document.getElementById('comment-input').focus();
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  if (!isOpen) return null;

  return (
    <div className="comments-panel">
      <div className="comments-header">
        <h3>Comments</h3>
        <button className="close-button" onClick={onClose}>&times;</button>
      </div>

      <div className="comments-content">
        {error && <div className="alert alert-danger">{error}</div>}
        
        {isLoading ? (
          <div className="loading-indicator">Loading comments...</div>
        ) : (
          <>
            <div className="comments-list">
              {comments.length === 0 ? (
                <p className="no-comments">No comments yet. Be the first to comment!</p>
              ) : (
                comments.map(comment => (
                  <div key={comment._id} className="comment-item">
                    <div className="comment-header">
                      <div className="comment-author">{comment.user.name}</div>
                      <div className="comment-time">{getRelativeTimeString(comment.createdAt)}</div>
                    </div>
                    <div className="comment-text">{comment.text}</div>
                    <div className="comment-actions">
                      <button 
                        className="comment-action-btn"
                        onClick={() => handleReply(comment)}
                      >
                        Reply
                      </button>
                      {comment.user._id === userId && (
                        <button 
                          className="comment-action-btn delete-btn"
                          onClick={() => handleDeleteComment(comment._id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    
                    {comment.replies.length > 0 && (
                      <div className="comment-replies">
                        {comment.replies.map(reply => (
                          <div key={reply._id} className="reply-item">
                            <div className="comment-header">
                              <div className="comment-author">{reply.user.name}</div>
                              <div className="comment-time">{getRelativeTimeString(reply.createdAt)}</div>
                            </div>
                            <div className="comment-text">{reply.text}</div>
                            <div className="comment-actions">
                              {reply.user._id === userId && (
                                <button 
                                  className="comment-action-btn delete-btn"
                                  onClick={() => handleDeleteComment(comment._id, reply._id)}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            
            <div className="comment-form-container">
              {replyTo && (
                <div className="reply-indicator">
                  <span>Replying to {replyTo.user.name}</span>
                  <button className="cancel-reply-btn" onClick={cancelReply}>Cancel</button>
                </div>
              )}
              
              <form onSubmit={handleAddComment} className="comment-form">
                <textarea
                  id="comment-input"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={replyTo ? "Write a reply..." : "Add a comment..."}
                  className="comment-input"
                  rows="3"
                />
                <button 
                  type="submit" 
                  className="btn btn-primary comment-submit"
                  disabled={!newComment.trim()}
                >
                  {replyTo ? 'Reply' : 'Comment'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

CommentSystem.propTypes = {
  documentId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  userName: PropTypes.string,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default CommentSystem;

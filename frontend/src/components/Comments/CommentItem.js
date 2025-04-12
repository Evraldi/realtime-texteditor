import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { formatDistanceToNow } from 'date-fns';
import ReplyList from './ReplyList';
import '../../styles/comments.css';

/**
 * Component to display a single comment with its replies
 */
const CommentItem = ({ 
  comment, 
  currentUser, 
  onUpdateComment, 
  onDeleteComment, 
  onAddReply 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isAddingReply, setIsAddingReply] = useState(false);

  // Check if current user is the comment author
  const isAuthor = currentUser && comment.user && 
    currentUser._id === comment.user._id;

  // Format the comment date
  const formattedDate = comment.createdAt ? 
    formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : 
    'Just now';

  // Handle comment edit submission
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (editText.trim()) {
      onUpdateComment(comment._id, { text: editText });
      setIsEditing(false);
    }
  };

  // Handle comment resolution toggle
  const handleResolveToggle = () => {
    onUpdateComment(comment._id, { isResolved: !comment.isResolved });
  };

  // Handle reply submission
  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (replyText.trim()) {
      onAddReply(comment._id, replyText);
      setReplyText('');
      setIsAddingReply(false);
      setShowReplies(true); // Show replies after adding a new one
    }
  };

  // Get the position text to display
  const getPositionText = () => {
    if (!comment.position) return null;
    
    const { line, ch, selectedText } = comment.position;
    
    if (selectedText) {
      return `"${selectedText.substring(0, 30)}${selectedText.length > 30 ? '...' : ''}"`;
    }
    
    return `Line ${line + 1}, Column ${ch + 1}`;
  };

  return (
    <div className={`comment-item ${comment.isResolved ? 'resolved' : ''}`}>
      <div className="comment-header">
        <div className="comment-author">
          <div 
            className="avatar" 
            style={{ backgroundColor: comment.user?.profileColor || '#4a6fa5' }}
          >
            {comment.user?.displayName?.charAt(0) || comment.user?.username?.charAt(0) || '?'}
          </div>
          <div className="author-info">
            <span className="author-name">
              {comment.user?.displayName || comment.user?.username || 'Unknown User'}
            </span>
            <span className="comment-date">{formattedDate}</span>
          </div>
        </div>
        
        <div className="comment-actions">
          {isAuthor && (
            <>
              <button 
                className="action-button edit-button" 
                onClick={() => setIsEditing(!isEditing)}
                title="Edit comment"
              >
                ✎
              </button>
              <button 
                className="action-button delete-button" 
                onClick={() => onDeleteComment(comment._id)}
                title="Delete comment"
              >
                🗑
              </button>
            </>
          )}
          <button 
            className={`action-button resolve-button ${comment.isResolved ? 'resolved' : ''}`} 
            onClick={handleResolveToggle}
            title={comment.isResolved ? "Mark as unresolved" : "Mark as resolved"}
          >
            {comment.isResolved ? '✓' : '○'}
          </button>
        </div>
      </div>
      
      {comment.position && (
        <div className="comment-position">
          {getPositionText()}
        </div>
      )}
      
      <div className="comment-content">
        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="edit-form">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="edit-textarea"
              required
            />
            <div className="edit-actions">
              <button type="submit" className="save-button">Save</button>
              <button 
                type="button" 
                className="cancel-button"
                onClick={() => {
                  setIsEditing(false);
                  setEditText(comment.text);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="comment-text">{comment.text}</div>
        )}
      </div>
      
      <div className="comment-footer">
        <button 
          className="reply-toggle" 
          onClick={() => setShowReplies(!showReplies)}
        >
          {comment.replies?.length > 0 ? (
            `${showReplies ? 'Hide' : 'Show'} ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`
          ) : (
            'No replies'
          )}
        </button>
        
        <button 
          className="add-reply-button"
          onClick={() => setIsAddingReply(!isAddingReply)}
        >
          Reply
        </button>
      </div>
      
      {isAddingReply && (
        <form onSubmit={handleReplySubmit} className="reply-form">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className="reply-textarea"
            required
          />
          <div className="reply-actions">
            <button type="submit" className="post-reply-button">Post</button>
            <button 
              type="button" 
              className="cancel-reply-button"
              onClick={() => {
                setIsAddingReply(false);
                setReplyText('');
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      
      {showReplies && comment.replies?.length > 0 && (
        <ReplyList 
          replies={comment.replies} 
          commentId={comment._id}
          currentUser={currentUser}
          onUpdateComment={onUpdateComment}
        />
      )}
    </div>
  );
};

CommentItem.propTypes = {
  comment: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    user: PropTypes.shape({
      _id: PropTypes.string.isRequired,
      username: PropTypes.string,
      displayName: PropTypes.string,
      profileColor: PropTypes.string
    }),
    position: PropTypes.shape({
      line: PropTypes.number,
      ch: PropTypes.number,
      selectedText: PropTypes.string
    }),
    replies: PropTypes.array,
    isResolved: PropTypes.bool,
    createdAt: PropTypes.string
  }).isRequired,
  currentUser: PropTypes.object,
  onUpdateComment: PropTypes.func.isRequired,
  onDeleteComment: PropTypes.func.isRequired,
  onAddReply: PropTypes.func.isRequired
};

export default CommentItem;

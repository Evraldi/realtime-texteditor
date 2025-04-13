import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { formatDistanceToNow } from 'date-fns';
import ReplyForm from './ReplyForm';
import './CommentsVariables.css';
import './CommentItem.css';

/**
 * CommentItem - A component to display a single comment
 *
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.comment - The comment object to display
 * @param {Object} props.currentUser - The current user object
 * @param {boolean} props.isDocumentOwner - Whether the current user is the document owner
 * @param {Function} props.onUpdateComment - Function to update a comment
 * @param {Function} props.onDeleteComment - Function to delete a comment
 * @param {Function} props.onAddReply - Function to add a reply to a comment
 * @param {Function} props.onUpdateReply - Function to update a reply
 * @param {Function} props.onDeleteReply - Function to delete a reply
 * @returns {JSX.Element} Rendered component
 */
const CommentItem = ({
  comment,
  currentUser,
  isDocumentOwner,
  onUpdateComment,
  onDeleteComment,
  onAddReply,
  onUpdateReply,
  onDeleteReply
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [isReplying, setIsReplying] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editReplyText, setEditReplyText] = useState('');

  // Update _uiState when state changes if needed
  useEffect(() => {
    // Store UI state in the comment object
    comment._uiState = {
      ...comment._uiState
    };
  }, [comment]);

  // Check if current user is the comment author - compare string IDs to be safe
  // Add fallback for currentUser._id which might be undefined
  const currentUserId = currentUser?._id || currentUser?.id || 'anonymous';
  const commentUserId = comment.user?._id || comment.user?.id || '';

  // Check if current user is the comment author
  const isCommentAuthor = currentUser && comment.user &&
                         (String(currentUserId) === String(commentUserId));

  // For debugging - always log these values to help troubleshoot
  console.log('Current user ID:', currentUserId);
  console.log('Comment user ID:', commentUserId);
  console.log('Is comment author:', isCommentAuthor);
  console.log('Current user object:', currentUser);

  // isDocumentOwner is passed as a prop from the parent component
  // This determines if the current user is the document owner

  // For debugging - always log these values to help troubleshoot
  console.log('Comment user ID:', comment.user?._id);
  console.log('Current user ID:', currentUser?._id);
  console.log('Is comment author:', isCommentAuthor);
  console.log('Is document owner:', isDocumentOwner);

  // Note: Access control is implemented directly in the JSX using isCommentAuthor and isDocumentOwner

  // Format the comment date
  const formattedDate = comment.createdAt
    ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
    : 'Just now';

  /**
   * Handle comment edit submission
   * @param {React.FormEvent} e - Form event
   */
  const handleEditSubmit = (e) => {
    e.preventDefault();
    const trimmedText = editText.trim();

    if (trimmedText) {
      try {
        onUpdateComment(comment._id, { text: trimmedText });
        setIsEditing(false);
      } catch (error) {
        console.error('Error updating comment:', error);
      }
    }
  };

  /**
   * Handle comment resolution toggle
   */
  const handleResolveToggle = async () => {
    try {
      console.log('Toggling comment resolution for comment:', comment._id);
      console.log('Current user:', currentUser);
      console.log('Is comment author:', isCommentAuthor);
      console.log('Is document owner:', isDocumentOwner);

      await onUpdateComment(comment._id, { isResolved: !comment.isResolved });
    } catch (error) {
      console.error('Error toggling comment resolution:', error);
      alert(`Failed to update comment: ${error.message || 'Unknown error'}`);
    }
  };

  /**
   * Handle adding a reply to this comment
   * @param {string} commentId - ID of the comment to reply to
   * @param {Object} replyData - Reply data
   */
  const handleAddReply = async (commentId, replyData) => {
    try {
      console.log('CommentItem: Adding reply to comment:', commentId, 'with data:', replyData);
      await onAddReply(commentId, replyData);
      setIsReplying(false);
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  /**
   * Toggle reply form visibility
   */
  const toggleReplyForm = () => {
    setIsReplying(!isReplying);
  };

  /**
   * Handle editing a reply
   * @param {string} replyId - ID of the reply to edit
   * @param {string} text - Current text of the reply
   */
  const handleEditReply = (replyId, text) => {
    setEditingReplyId(replyId);
    setEditReplyText(text);
  };

  /**
   * Handle submitting an edited reply
   * @param {string} replyId - ID of the reply being edited
   */
  const handleSubmitReplyEdit = async (replyId) => {
    if (!editReplyText.trim()) return;

    try {
      await onUpdateReply(comment._id, replyId, { text: editReplyText.trim() });
      setEditingReplyId(null);
      setEditReplyText('');
    } catch (error) {
      console.error('Error updating reply:', error);
    }
  };

  /**
   * Handle canceling reply edit
   */
  const handleCancelReplyEdit = () => {
    setEditingReplyId(null);
    setEditReplyText('');
  };

  /**
   * Handle deleting a reply with confirmation
   * @param {string} replyId - ID of the reply to delete
   */
  const handleDeleteReply = (replyId) => {
    if (window.confirm('Are you sure you want to delete this reply?')) {
      try {
        onDeleteReply(comment._id, replyId);
      } catch (error) {
        console.error('Error deleting reply:', error);
      }
    }
  };

  /**
   * Get the position text to display
   * @returns {string|null} Formatted position text
   */
  const getPositionText = () => {
    if (!comment.position) return null;

    const { line, ch, selectedText, selection } = comment.position;

    if (selectedText) {
      const truncatedText = selectedText.substring(0, 30);
      const ellipsis = selectedText.length > 30 ? '...' : '';
      return `"${truncatedText}${ellipsis}"`;
    }

    if (selection) {
      const { start, end } = selection;
      if (start && end) {
        if (start.line === end.line) {
          return `Selection at line ${start.line + 1}, columns ${start.ch + 1}-${end.ch + 1}`;
        } else {
          return `Selection from line ${start.line + 1}, column ${start.ch + 1} to line ${end.line + 1}, column ${end.ch + 1}`;
        }
      }
    }

    return `Line ${line + 1}, Column ${ch + 1}`;
  };

  /**
   * Get the position indicator class based on the comment position
   * @returns {string} CSS class for the position indicator
   */
  const getPositionIndicatorClass = () => {
    if (!comment.position) return '';

    if (comment.position.selectedText) {
      return 'has-selection';
    }

    return '';
  };

  // Get the first character for the avatar
  const getAvatarInitial = () => {
    return comment.user?.displayName?.charAt(0) ||
           comment.user?.username?.charAt(0) ||
           '?';
  };

  // Get the display name
  const getDisplayName = () => {
    return comment.user?.displayName ||
           comment.user?.username ||
           'Unknown User';
  };



  // Handle delete with confirmation
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        onDeleteComment(comment._id);
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  return (
    <div className={`comment-item ${comment.isResolved ? 'resolved' : ''}`}>
      <div className="comment-header">
        <div className="comment-author">
          <div
            className="avatar"
            style={{ backgroundColor: comment.user?.profileColor || 'var(--comment-avatar-color)' }}
            aria-hidden="true"
          >
            {getAvatarInitial()}
          </div>
          <div className="author-info">
            <span className="author-name">{getDisplayName()}</span>
            <span className="comment-date">{formattedDate}</span>
          </div>
        </div>

        {/* Show replying to information if this is a reply */}
        {comment.isReplyTo && (
          <div className="replying-to">
            <span className="replying-to-label">Replying to:</span>
            <span className="replying-to-name">
              {comment.isReplyTo.commentUser?.displayName ||
               comment.isReplyTo.commentUser?.username ||
               'Unknown User'}
            </span>
          </div>
        )}

        <div className="comment-actions">
          {/* Edit button - only visible to comment author */}
          {isCommentAuthor && (
            <button
              className="action-button edit-button"
              onClick={() => setIsEditing(!isEditing)}
              title="Edit comment"
              aria-label="Edit comment"
            >
              <span aria-hidden="true">✎ Edit</span>
            </button>
          )}

          {/* Delete button - visible to comment author and document owner */}
          {(isCommentAuthor || isDocumentOwner) && (
            <button
              className="action-button delete-button"
              onClick={handleDelete}
              title="Delete comment"
              aria-label="Delete comment"
            >
              <span aria-hidden="true">🗑 Delete</span>
            </button>
          )}

          {/* Resolve button - visible to everyone */}
          <button
            className={`action-button resolve-button ${comment.isResolved ? 'resolved' : ''}`}
            onClick={handleResolveToggle}
            title={comment.isResolved ? "Mark as unresolved" : "Mark as resolved"}
            aria-label={comment.isResolved ? "Mark as unresolved" : "Mark as resolved"}
            aria-pressed={comment.isResolved}
          >
            <span aria-hidden="true">{comment.isResolved ? '✓ Resolved' : '○ Resolve'}</span>
          </button>
        </div>
      </div>

      {comment.position && (
        <div className={`comment-position ${getPositionIndicatorClass()}`} aria-label="Comment position">
          <span className="position-icon" aria-hidden="true">
            {comment.position.selectedText ? '""' : '📍'}
          </span>
          <span className="position-text">{getPositionText()}</span>
          {comment.position.selectedText && (
            <button
              className="show-in-document-button"
              title="Show in document"
              aria-label="Show this comment's position in document"
              onClick={() => console.log('Show position in document:', comment.position)}
            >
              <span aria-hidden="true">👁️</span>
            </button>
          )}
        </div>
      )}

      <div className="comment-content">
        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="edit-form">
            <label htmlFor="edit-comment-textarea" className="sr-only">Edit comment</label>
            <textarea
              id="edit-comment-textarea"
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
        {!isEditing && !comment.isResolved && (
          <button
            className="reply-button"
            onClick={toggleReplyForm}
            aria-label="Reply to comment"
          >
            Reply
          </button>
        )}
      </div>

      {/* Reply form */}
      {isReplying && (
        <ReplyForm
          commentId={comment._id}
          onAddReply={handleAddReply}
          onCancel={() => setIsReplying(false)}
        />
      )}

      {/* Display replies if any */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="replies-section">
          {comment.replies.map(reply => {
            // Check if current user is the reply author - compare string IDs to be safe
            // Add fallback for currentUser._id which might be undefined
            const replyCurrentUserId = currentUser?._id || currentUser?.id || 'anonymous';
            const replyUserId = reply.user?._id || reply.user?.id || '';

            // Check if current user is the reply author
            const isReplyAuthor = currentUser && reply.user &&
                                 (String(replyCurrentUserId) === String(replyUserId));

            // isDocumentOwner is already available from the parent component's props
            // This determines if the current user is the document owner

            // For debugging - uncomment if needed
            // console.log('Reply current user ID:', replyCurrentUserId);
            // console.log('Reply user ID:', replyUserId);
            // console.log('Is reply author:', isReplyAuthor);
            // console.log('Is document owner:', isDocumentOwner);

            // Note: Access control is implemented directly in the JSX using isReplyAuthor and isDocumentOwner

            return (
              <div key={reply._id} className="reply-item">
                <div className="reply-header">
                  <div className="reply-author">
                    <div
                      className="avatar small"
                      style={{ backgroundColor: reply.user?.profileColor || 'var(--comment-avatar-color)' }}
                      aria-hidden="true"
                    >
                      {reply.user?.displayName?.charAt(0) || reply.user?.username?.charAt(0) || '?'}
                    </div>
                    <div className="author-info">
                      <span className="author-name">
                        {reply.user?.displayName || reply.user?.username || 'Unknown User'}
                      </span>
                      <span className="comment-date">
                        {reply.createdAt
                          ? formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })
                          : 'Just now'}
                      </span>
                    </div>
                  </div>

                  {/* Reply actions - always visible but with opacity controlled by CSS */}
                  <div className="reply-actions">
                    {/* Edit button - only visible to reply author */}
                    {isReplyAuthor && (
                      <button
                        className="action-button edit-button small"
                        onClick={() => handleEditReply(reply._id, reply.text)}
                        title="Edit reply"
                        aria-label="Edit reply"
                      >
                        <span aria-hidden="true">✎ Edit</span>
                      </button>
                    )}

                    {/* Delete button - visible to reply author and document owner */}
                    {(isReplyAuthor || isDocumentOwner) && (
                      <button
                        className="action-button delete-button small"
                        onClick={() => handleDeleteReply(reply._id)}
                        title="Delete reply"
                        aria-label="Delete reply"
                      >
                        <span aria-hidden="true">🗑 Delete</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="reply-content">
                  {editingReplyId === reply._id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmitReplyEdit(reply._id);
                      }}
                      className="edit-form"
                    >
                      <label htmlFor={`edit-reply-${reply._id}`} className="sr-only">Edit reply</label>
                      <textarea
                        id={`edit-reply-${reply._id}`}
                        value={editReplyText}
                        onChange={(e) => setEditReplyText(e.target.value)}
                        className="edit-textarea"
                        required
                        autoFocus
                      />
                      <div className="edit-actions">
                        <button type="submit" className="save-button">Save</button>
                        <button
                          type="button"
                          className="cancel-button"
                          onClick={handleCancelReplyEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="reply-text">{reply.text}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

CommentItem.propTypes = {
  comment: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    user: PropTypes.shape({
      _id: PropTypes.string,
      username: PropTypes.string,
      displayName: PropTypes.string,
      profileColor: PropTypes.string
    }),
    position: PropTypes.shape({
      line: PropTypes.number,
      ch: PropTypes.number,
      selectedText: PropTypes.string
    }),
    isResolved: PropTypes.bool,
    createdAt: PropTypes.string,
    replies: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        text: PropTypes.string.isRequired,
        user: PropTypes.shape({
          _id: PropTypes.string,
          username: PropTypes.string,
          displayName: PropTypes.string,
          profileColor: PropTypes.string
        }),
        createdAt: PropTypes.string
      })
    )
  }).isRequired,
  currentUser: PropTypes.object,
  isDocumentOwner: PropTypes.bool, // Added prop to determine if current user is document owner
  onUpdateComment: PropTypes.func.isRequired,
  onDeleteComment: PropTypes.func.isRequired,
  onAddReply: PropTypes.func.isRequired,
  onUpdateReply: PropTypes.func.isRequired,
  onDeleteReply: PropTypes.func.isRequired
};

CommentItem.defaultProps = {
  isDocumentOwner: false // Default value if not provided
};

// Add a small CSS class for screen reader only text
if (!document.getElementById('sr-only-style')) {
  const style = document.createElement('style');
  style.id = 'sr-only-style';
  style.innerHTML = `
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
  `;
  document.head.appendChild(style);
}

export default CommentItem;

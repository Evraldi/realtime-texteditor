import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useAuth } from '../../context/AuthContext';
import '../../styles/comments.css';

/**
 * Component for adding a new comment
 */
const NewCommentForm = ({ onAddComment, initialPosition = null, onCancel = null }) => {
  const [text, setText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get user from Redux store with fallback to context
  const auth = useSelector(state => state?.auth);
  const { user: contextUser } = useAuth();
  const user = auth?.user || contextUser || { _id: 'anonymous', username: 'Anonymous' };

  // Always show expanded form when initialPosition is provided
  useEffect(() => {
    if (initialPosition) {
      setIsExpanded(true);
    }
  }, [initialPosition]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!text.trim()) return;

    setIsSubmitting(true);

    try {
      // Create the comment object
      const newComment = {
        text: text.trim(),
        user: user._id,
        position: initialPosition,
        status: 'open'
      };

      // Call the parent handler
      await onAddComment(newComment);

      // Reset the form
      setText('');
      setIsExpanded(false);

      // Call cancel handler if provided
      if (onCancel) onCancel();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Always show expanded form when initialPosition is provided
  useEffect(() => {
    if (initialPosition) {
      setIsExpanded(true);
    }
  }, [initialPosition]);

  // Remove duplicate effect (there was a duplicate below)

  return (
    <div className="new-comment-container">
      {isExpanded || initialPosition ? (
        <form onSubmit={handleSubmit} className="new-comment-form">
          <h3 className="comment-form-title">Add Comment</h3>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment..."
            className="comment-textarea"
            autoFocus
            required
          />

          {initialPosition && (
            <div className="comment-position-indicator">
              {initialPosition.selectedText && initialPosition.selectedText.length > 0 ? (
                <span>
                  Commenting on: "{initialPosition.selectedText.substring(0, 30)}
                  {initialPosition.selectedText.length > 30 ? '...' : ''}"
                </span>
              ) : (
                <span>
                  Commenting at Line {initialPosition.line + 1}, Column {initialPosition.ch + 1}
                </span>
              )}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => {
                setText('');
                setIsExpanded(false);
                if (onCancel) onCancel();
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting || !text.trim()}
            >
              {isSubmitting ? 'Adding...' : 'Add Comment'}
            </button>
          </div>
        </form>
      ) : (
        <div
          className="comment-placeholder"
          onClick={() => setIsExpanded(true)}
        >
          <span>Add a comment...</span>
        </div>
      )}
    </div>
  );
};

NewCommentForm.propTypes = {
  onAddComment: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  initialPosition: PropTypes.shape({
    index: PropTypes.number,
    line: PropTypes.number,
    ch: PropTypes.number,
    selectedText: PropTypes.string,
    selection: PropTypes.shape({
      start: PropTypes.shape({
        line: PropTypes.number,
        ch: PropTypes.number
      }),
      end: PropTypes.shape({
        line: PropTypes.number,
        ch: PropTypes.number
      })
    })
  })
};

export default NewCommentForm;

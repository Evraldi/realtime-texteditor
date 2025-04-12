import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useAuth } from '../../context/AuthContext';
import './CommentsVariables.css';
import './NewCommentForm.css';

/**
 * NewCommentForm - A component for adding a new comment
 *
 * @component
 * @param {Object} props - Component props
 * @param {Function} props.onAddComment - Function to add a new comment
 * @param {Object} props.initialPosition - Initial position for the comment
 * @param {Function} props.onCancel - Function to call when canceling
 * @returns {JSX.Element} Rendered component
 */
const NewCommentForm = ({ onAddComment, initialPosition = null, onCancel = null }) => {
  const [text, setText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get user from Redux store with fallback to context
  const auth = useSelector(state => state?.auth);
  const { user: contextUser } = useAuth();
  const user = auth?.user || contextUser || { _id: 'anonymous', username: 'Anonymous' };

  /**
   * Handle form submission
   * @param {React.FormEvent} e - Form event
   */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const trimmedText = text.trim();

    if (!trimmedText) return;

    setIsSubmitting(true);

    try {
      // Create the comment object
      const newComment = {
        text: trimmedText,
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
  }, [text, user._id, initialPosition, onAddComment, onCancel]);

  /**
   * Handle cancel button click
   */
  const handleCancel = useCallback(() => {
    setText('');
    setIsExpanded(false);
    if (onCancel) onCancel();
  }, [onCancel]);

  // Always show expanded form when initialPosition is provided
  useEffect(() => {
    if (initialPosition) {
      setIsExpanded(true);
    }
  }, [initialPosition]);

  /**
   * Get position text for the comment
   * @returns {JSX.Element} Position indicator element
   */
  const getPositionIndicator = () => {
    if (!initialPosition) return null;

    if (initialPosition.selectedText && initialPosition.selectedText.length > 0) {
      const truncatedText = initialPosition.selectedText.substring(0, 30);
      const ellipsis = initialPosition.selectedText.length > 30 ? '...' : '';

      return (
        <span>
          Commenting on: "{truncatedText}{ellipsis}"
        </span>
      );
    }

    return (
      <span>
        Commenting at Line {initialPosition.line + 1}, Column {initialPosition.ch + 1}
      </span>
    );
  };

  return (
    <div className="new-comment-container">
      {isExpanded || initialPosition ? (
        <form onSubmit={handleSubmit} className="new-comment-form">
          <h3 className="comment-form-title">Add Comment</h3>
          <label htmlFor="new-comment-textarea" className="sr-only">Write a comment</label>
          <textarea
            id="new-comment-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment..."
            className="comment-textarea"
            autoFocus
            required
          />

          {initialPosition && (
            <div className="comment-position-indicator" aria-live="polite">
              {getPositionIndicator()}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={handleCancel}
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
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsExpanded(true);
              e.preventDefault();
            }
          }}
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

// Default props are now handled with JavaScript default parameters in the function signature

export default NewCommentForm;

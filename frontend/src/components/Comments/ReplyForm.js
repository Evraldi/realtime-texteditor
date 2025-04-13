import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useAuth } from '../../context/AuthContext';
import './CommentsVariables.css';
import './ReplyForm.css';

/**
 * ReplyForm - A component for adding a reply to a comment
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.commentId - ID of the parent comment
 * @param {Function} props.onAddReply - Function to add a new reply
 * @param {Function} props.onCancel - Function to call when canceling
 * @returns {JSX.Element} Rendered component
 */
const ReplyForm = ({ commentId, onAddReply, onCancel }) => {
  const [text, setText] = useState('');
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
      // Create the reply object
      const newReply = {
        text: trimmedText
      };

      // Call the parent handler
      await onAddReply(commentId, newReply);

      // Reset the form
      setText('');
      
      // Call cancel handler to close the form
      if (onCancel) onCancel();
    } catch (error) {
      console.error('Error adding reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [text, commentId, onAddReply, onCancel]);

  /**
   * Handle cancel button click
   */
  const handleCancel = useCallback(() => {
    setText('');
    if (onCancel) onCancel();
  }, [onCancel]);

  return (
    <div className="reply-form-container">
      <form onSubmit={handleSubmit} className="reply-form">
        <label htmlFor="reply-textarea" className="sr-only">Write a reply</label>
        <textarea
          id="reply-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a reply..."
          className="reply-textarea"
          autoFocus
          required
        />
        <div className="reply-actions">
          <button
            type="button"
            className="cancel-reply-button"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="post-reply-button"
            disabled={isSubmitting || !text.trim()}
          >
            {isSubmitting ? 'Posting...' : 'Post Reply'}
          </button>
        </div>
      </form>
    </div>
  );
};

ReplyForm.propTypes = {
  commentId: PropTypes.string.isRequired,
  onAddReply: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default ReplyForm;

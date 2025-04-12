import React from 'react';
import PropTypes from 'prop-types';
import { formatDistanceToNow } from 'date-fns';
import '../../styles/comments.css';

/**
 * Component to display a list of replies for a comment
 */
const ReplyList = ({ replies, commentId, currentUser, onUpdateComment }) => {
  // Delete a reply
  const handleDeleteReply = async (replyId) => {
    try {
      // Filter out the deleted reply
      const updatedReplies = replies.filter(reply => reply._id !== replyId);
      
      // Update the comment with the new replies array
      onUpdateComment(commentId, { replies: updatedReplies });
    } catch (err) {
      console.error('Error deleting reply:', err);
    }
  };

  return (
    <div className="replies-container">
      {replies.map(reply => {
        // Check if current user is the reply author
        const isAuthor = currentUser && reply.user && 
          currentUser._id === reply.user._id;
        
        // Format the reply date
        const formattedDate = reply.createdAt ? 
          formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true }) : 
          'Just now';
          
        return (
          <div key={reply._id} className="reply-item">
            <div className="reply-header">
              <div className="reply-author">
                <div 
                  className="avatar small" 
                  style={{ backgroundColor: reply.user?.profileColor || '#4a6fa5' }}
                >
                  {reply.user?.displayName?.charAt(0) || reply.user?.username?.charAt(0) || '?'}
                </div>
                <div className="author-info">
                  <span className="author-name">
                    {reply.user?.displayName || reply.user?.username || 'Unknown User'}
                  </span>
                  <span className="reply-date">{formattedDate}</span>
                </div>
              </div>
              
              {isAuthor && (
                <div className="reply-actions">
                  <button 
                    className="action-button delete-button small" 
                    onClick={() => handleDeleteReply(reply._id)}
                    title="Delete reply"
                  >
                    🗑
                  </button>
                </div>
              )}
            </div>
            
            <div className="reply-content">
              <div className="reply-text">{reply.text}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

ReplyList.propTypes = {
  replies: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
      user: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        username: PropTypes.string,
        displayName: PropTypes.string,
        profileColor: PropTypes.string
      }),
      createdAt: PropTypes.string
    })
  ).isRequired,
  commentId: PropTypes.string.isRequired,
  currentUser: PropTypes.object,
  onUpdateComment: PropTypes.func.isRequired
};

export default ReplyList;

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import CommentItem from './CommentItem';
import NewCommentForm from './NewCommentForm';
// import { API_URL } from '../../config/constants';
import '../../styles/comments.css';

/**
 * Component to display a list of comments for a document
 */
const CommentList = ({ documentId, onClose }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'open', 'resolved'
  // Get auth data from Redux store with fallback to context
  const auth = useSelector(state => state?.auth);
  const { user: contextUser } = useAuth();
  const token = auth?.token || localStorage.getItem('token');
  const user = auth?.user || contextUser || { _id: 'anonymous' };

  // Fetch comments when component mounts
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/comments/document/${documentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setComments(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching comments:', err);
        setError('Failed to load comments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (documentId && token) {
      fetchComments();
    }
  }, [documentId, token]);

  // Add a new comment
  const handleAddComment = async (newComment) => {
    try {
      const response = await axios.post(
        `/api/comments/document/${documentId}`,
        newComment,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComments(prevComments => [response.data, ...prevComments]);
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment. Please try again.');
    }
  };

  // Update a comment
  const handleUpdateComment = async (commentId, updatedData) => {
    try {
      const response = await axios.put(
        `/api/comments/${commentId}`,
        updatedData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComments(prevComments =>
        prevComments.map(comment =>
          comment._id === commentId ? response.data : comment
        )
      );
    } catch (err) {
      console.error('Error updating comment:', err);
      setError('Failed to update comment. Please try again.');
    }
  };

  // Delete a comment
  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(
        `/api/comments/${commentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComments(prevComments =>
        prevComments.filter(comment => comment._id !== commentId)
      );
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Failed to delete comment. Please try again.');
    }
  };

  // Add a reply to a comment
  const handleAddReply = async (commentId, replyText) => {
    try {
      const response = await axios.post(
        `/api/comments/${commentId}/replies`,
        { text: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComments(prevComments =>
        prevComments.map(comment =>
          comment._id === commentId ? response.data : comment
        )
      );
    } catch (err) {
      console.error('Error adding reply:', err);
      setError('Failed to add reply. Please try again.');
    }
  };

  // Filter comments based on active filter
  const filteredComments = comments.filter(comment => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'open') return !comment.isResolved;
    if (activeFilter === 'resolved') return comment.isResolved;
    return true;
  });

  return (
    <div className="comments-panel">
      <div className="comments-header">
        <h2>Comments</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="comments-filter">
        <button
          className={`filter-button ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-button ${activeFilter === 'open' ? 'active' : ''}`}
          onClick={() => setActiveFilter('open')}
        >
          Open
        </button>
        <button
          className={`filter-button ${activeFilter === 'resolved' ? 'active' : ''}`}
          onClick={() => setActiveFilter('resolved')}
        >
          Resolved
        </button>
      </div>

      <NewCommentForm onAddComment={handleAddComment} />

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-spinner">Loading comments...</div>
      ) : (
        <div className="comments-list">
          {filteredComments.length === 0 ? (
            <div className="no-comments">No comments yet</div>
          ) : (
            filteredComments.map(comment => (
              <CommentItem
                key={comment._id}
                comment={comment}
                currentUser={user}
                onUpdateComment={handleUpdateComment}
                onDeleteComment={handleDeleteComment}
                onAddReply={handleAddReply}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

CommentList.propTypes = {
  documentId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired
};

export default CommentList;

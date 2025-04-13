import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../SocketProvider';
import CommentItem from './CommentItem';
import NewCommentForm from './NewCommentForm';
import axios from '../../utils/axiosConfig';
import { STORAGE_KEYS } from '../../config/constants';
import { debugAuth, fixAuthTokens } from '../../utils/debugAuth';
import './CommentsVariables.css';
import './CommentList.css';

/**
 * CommentList - A component to display a list of comments for a document
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.documentId - ID of the document
 * @param {Function} props.onClose - Function to close the comments panel
 * @returns {JSX.Element} Rendered component
 */
const CommentList = ({ documentId, onClose }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'open', 'resolved'
  const [resolvedCount, setResolvedCount] = useState(0);
  const [openCount, setOpenCount] = useState(0);
  const [documentData, setDocumentData] = useState(null);
  // Get auth data from Redux store with fallback to context
  const auth = useSelector(state => state?.auth);
  const { user: contextUser } = useAuth();
  const token = auth?.token || localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

  // Try to get user from multiple sources
  let user = auth?.user || contextUser;

  // If still no user, try to get from localStorage
  if (!user || !user._id) {
    try {
      // Try multiple storage keys
      const userJson = localStorage.getItem(STORAGE_KEYS.USER) ||
                      sessionStorage.getItem(STORAGE_KEYS.USER) ||
                      localStorage.getItem('user_data') ||
                      sessionStorage.getItem('user_data');

      if (userJson) {
        user = JSON.parse(userJson);
        console.log('User loaded from storage:', user);

        // If user object doesn't have _id but has id, use id as _id
        if (!user._id && user.id) {
          user._id = user.id;
          console.log('Using user.id as user._id:', user._id);
        }
      }
    } catch (error) {
      console.error('Error parsing user from storage:', error);
    }
  }

  // Try to get user ID from token if still no user
  if (!user || !user._id) {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
                   sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

      if (token) {
        // Try to decode JWT token to get user ID
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          if (payload.userId || payload.sub) {
            user = { _id: payload.userId || payload.sub };
            console.log('User ID extracted from token:', user._id);
          }
        }
      }
    } catch (error) {
      console.error('Error extracting user ID from token:', error);
    }
  }

  // Fallback to anonymous if still no user
  if (!user || !user._id) {
    user = { _id: 'anonymous' };
    console.warn('Using anonymous user as fallback');
  }

  // For debugging - always log these values to help troubleshoot
  console.log('Final user object:', user);
  console.log('User ID type:', typeof user._id);
  console.log('User ID value:', user._id);

  const { isConnected, emit, on } = useSocket();

  // For debugging - always log these values to help troubleshoot
  console.log('User object:', user);
  console.log('Document data:', documentData);

  // Check if current user is the document owner by comparing user ID with document createdBy
  const documentOwnerId = documentData?.createdBy?._id || documentData?.createdBy || '';
  const currentUserId = user?._id || user?.id || 'anonymous';

  const isDocumentOwner = user && documentData && documentOwnerId &&
                         (String(currentUserId) === String(documentOwnerId));

  console.log('Document owner ID:', documentOwnerId);
  console.log('Current user ID for document owner check:', currentUserId);
  console.log('Is document owner:', isDocumentOwner);

  // For debugging - uncomment if needed
  // console.log('Current user ID:', user?._id);
  // console.log('Document owner ID:', documentData?.createdBy);
  // console.log('Is document owner:', isDocumentOwner);

  /**
   * Fetch document data
   */
  const fetchDocumentData = useCallback(async () => {
    if (!documentId || !token) return;

    try {
      // Use the correct API endpoint for documents
      const response = await axios.get(`/api/document/${documentId}`);
      // For debugging - uncomment if needed
      // console.log('API response for document:', response.data);

      // Log the raw createdBy value
      console.log('Raw createdBy value:', response.data.createdBy);

      // If createdBy is an object with _id, use that, otherwise use the raw value
      if (response.data.createdBy && typeof response.data.createdBy === 'object') {
        console.log('createdBy is an object with _id:', response.data.createdBy._id);
      } else {
        console.log('createdBy is a string or other value:', response.data.createdBy);
      }

      setDocumentData(response.data);

      // For debugging - uncomment if needed
      // console.log('Document data after setting:', response.data);
      // console.log('Document owner ID:', response.data.createdBy);
    } catch (error) {
      console.error('Error fetching document data:', error);
    }
  }, [documentId, token]);

  /**
   * Fetch comments from the API
   */
  const fetchComments = useCallback(async () => {
    if (!documentId || !token) return;

    try {
      setLoading(true);
      const response = await axios.get(`/api/comments/document/${documentId}`);
      setComments(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [documentId, token]);

  // Fetch comments and document data when component mounts
  useEffect(() => {
    // Debug auth tokens and fix if needed
    console.log('CommentList mounted, debugging auth tokens...');
    debugAuth();

    // Fix auth tokens if needed
    const token = fixAuthTokens();
    if (token) {
      console.log('Auth tokens fixed, using token:', token.substring(0, 10) + '...');
    }

    // Fetch document data
    fetchDocumentData();

    // Fetch comments
    fetchComments();
  }, [fetchComments, fetchDocumentData]);

  // Set up socket listeners for real-time updates
  useEffect(() => {
    if (!isConnected || !documentId) return;

    console.log('Setting up socket listeners for comments');

    // Join document room
    emit('joinDocument', documentId);

    // Handle new comments
    const handleNewComment = (data) => {
      if (data.docId !== documentId) return;

      console.log('New comment received via socket:', data.comment);
      setComments(prevComments => {
        // Check if we already have this comment (avoid duplicates)
        if (prevComments.some(c => c._id === data.comment._id)) {
          return prevComments;
        }
        return [data.comment, ...prevComments];
      });
    };

    // Handle updated comments
    const handleUpdatedComment = (data) => {
      if (data.docId !== documentId || !data.comment) return;

      console.log('Comment update received via socket:', data.comment);

      setComments(prevComments => {
        return prevComments.map(comment =>
          comment._id === data.comment._id ? data.comment : comment
        );
      });
    };

    // Handle deleted comments
    const handleDeletedComment = (data) => {
      if (data.docId !== documentId || !data.commentId) return;

      console.log('Comment deletion received via socket:', data.commentId);

      setComments(prevComments => {
        return prevComments.filter(comment => comment._id !== data.commentId);
      });
    };

    // Handle new replies
    const handleNewReply = (data) => {
      if (data.docId !== documentId || !data.commentId || !data.reply) return;

      console.log('New reply received via socket:', data);

      setComments(prevComments => {
        return prevComments.map(comment => {
          if (comment._id === data.commentId) {
            // Check if we already have this reply (avoid duplicates)
            if (comment.replies.some(r => r._id === data.reply._id)) {
              return comment;
            }

            // Add the new reply
            return {
              ...comment,
              replies: [...comment.replies, data.reply]
            };
          }
          return comment;
        });
      });
    };

    // Handle updated replies
    const handleUpdatedReply = (data) => {
      if (data.docId !== documentId || !data.commentId || !data.replyId || !data.updatedReply) return;

      console.log('Reply update received via socket:', data);

      setComments(prevComments => {
        return prevComments.map(comment => {
          if (comment._id === data.commentId) {
            // Update the specific reply
            const updatedReplies = comment.replies.map(reply => {
              if (reply._id === data.replyId) {
                return { ...reply, ...data.updatedReply };
              }
              return reply;
            });

            return { ...comment, replies: updatedReplies };
          }
          return comment;
        });
      });
    };

    // Handle deleted replies
    const handleDeletedReply = (data) => {
      if (data.docId !== documentId || !data.commentId || !data.replyId) return;

      console.log('Reply deletion received via socket:', data);

      setComments(prevComments => {
        return prevComments.map(comment => {
          if (comment._id === data.commentId) {
            // Remove the specific reply
            const updatedReplies = comment.replies.filter(reply => reply._id !== data.replyId);
            return { ...comment, replies: updatedReplies };
          }
          return comment;
        });
      });
    };

    // Subscribe to events
    const unsubscribeNewComment = on('commentAdded', handleNewComment);
    const unsubscribeUpdatedComment = on('commentUpdated', handleUpdatedComment);
    const unsubscribeDeletedComment = on('commentDeleted', handleDeletedComment);
    const unsubscribeNewReply = on('commentReplyAdded', handleNewReply);
    const unsubscribeUpdatedReply = on('replyUpdated', handleUpdatedReply);
    const unsubscribeDeletedReply = on('replyDeleted', handleDeletedReply);

    // Clean up on unmount
    return () => {
      unsubscribeNewComment();
      unsubscribeUpdatedComment();
      unsubscribeDeletedComment();
      unsubscribeNewReply();
      unsubscribeUpdatedReply();
      unsubscribeDeletedReply();
    };
  }, [isConnected, documentId, emit, on]);

  // Update comment counts when comments change
  useEffect(() => {
    const resolved = comments.filter(comment => comment.isResolved).length;
    const open = comments.length - resolved;

    setResolvedCount(resolved);
    setOpenCount(open);
  }, [comments]);

  /**
   * Add a new comment
   * @param {Object} newComment - New comment data
   */
  const handleAddComment = useCallback(async (newComment) => {
    try {
      setError(null);
      const response = await axios.post(
        `/api/comments/document/${documentId}`,
        newComment
      );

      console.log('New comment added:', response.data);
      setComments(prevComments => [response.data, ...prevComments]);

      // Emit socket event for real-time updates
      if (isConnected) {
        emit('addComment', {
          docId: documentId,
          comment: response.data
        });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment. Please try again.');
    }
  }, [documentId]);

  /**
   * Update a comment
   * @param {string} commentId - ID of the comment to update
   * @param {Object} updatedData - Updated comment data
   */
  const handleUpdateComment = useCallback(async (commentId, updatedData) => {
    try {
      setError(null);
      console.log('Updating comment:', commentId, 'with data:', updatedData);

      // Log additional information for debugging
      console.log('Current user:', user);
      console.log('Document ID:', documentId);

      const response = await axios.put(
        `/api/comments/${commentId}`,
        updatedData
      );

      console.log('Comment updated, server response:', response.data);

      setComments(prevComments =>
        prevComments.map(comment =>
          comment._id === commentId ? response.data : comment
        )
      );

      // Emit socket event for real-time updates
      if (isConnected) {
        emit('updateComment', {
          docId: documentId,
          comment: response.data
        });
      }
    } catch (error) {
      console.error('Error updating comment:', error);

      // Get more detailed error message
      let errorMessage = 'Failed to update comment. Please try again.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }

      setError(errorMessage);
    }
  }, [documentId, isConnected, emit]);

  /**
   * Delete a comment
   * @param {string} commentId - ID of the comment to delete
   */
  const handleDeleteComment = useCallback(async (commentId) => {
    try {
      setError(null);
      console.log('Deleting comment:', commentId);

      // Log additional information for debugging
      console.log('Current user:', user);
      console.log('Document ID:', documentId);

      await axios.delete(`/api/comments/${commentId}`);

      console.log('Comment deleted successfully');

      setComments(prevComments =>
        prevComments.filter(comment => comment._id !== commentId)
      );

      // Emit socket event for real-time updates
      if (isConnected) {
        emit('deleteComment', {
          docId: documentId,
          commentId
        });
      }
    } catch (error) {
      console.error('Error deleting comment:', error);

      // Get more detailed error message
      let errorMessage = 'Failed to delete comment. Please try again.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }

      setError(errorMessage);
    }
  }, [documentId, isConnected, emit]);

  /**
   * Add a reply to a comment
   * @param {string} commentId - ID of the comment to reply to
   * @param {Object} replyData - Reply data
   */
  const handleAddReply = useCallback(async (commentId, replyData) => {
    try {
      setError(null);
      console.log('Adding reply to comment:', commentId, 'with data:', replyData);

      const response = await axios.post(
        `/api/comments/${commentId}/replies`,
        replyData
      );

      console.log('Reply added, server response:', response.data);

      // Make sure we're getting a valid response with the updated comment
      if (response.data && response.data._id) {
        // Find the comment we're updating
        const commentToUpdate = comments.find(c => c._id === commentId);

        if (commentToUpdate) {
          console.log('Original comment before update:', commentToUpdate);

          // Create a deep copy of the response data to avoid reference issues
          const updatedComment = JSON.parse(JSON.stringify(response.data));

          console.log('Updated comment after server response:', updatedComment);

          // Update the comments state with the new data
          setComments(prevComments =>
            prevComments.map(comment =>
              comment._id === commentId ? updatedComment : comment
            )
          );

          // Emit socket event for real-time updates
          if (isConnected) {
            emit('addCommentReply', {
              docId: documentId,
              commentId,
              reply: updatedComment.replies[updatedComment.replies.length - 1]
            });
          }
        } else {
          console.error('Comment not found in state:', commentId);
          setError('Failed to add reply. Comment not found.');
        }
      } else {
        console.error('Invalid response from server:', response.data);
        setError('Failed to add reply. Invalid server response.');
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      setError('Failed to add reply. Please try again.');
    }
  }, [comments]);

  /**
   * Update a reply
   * @param {string} commentId - ID of the parent comment
   * @param {string} replyId - ID of the reply to update
   * @param {Object} updatedData - Updated reply data
   */
  const handleUpdateReply = useCallback(async (commentId, replyId, updatedData) => {
    try {
      setError(null);
      console.log('Updating reply:', replyId, 'in comment:', commentId, 'with data:', updatedData);

      const response = await axios.put(
        `/api/comments/${commentId}/replies/${replyId}`,
        updatedData
      );

      console.log('Reply updated, server response:', response.data);

      // Find the comment containing the reply
      const commentToUpdate = comments.find(c => c._id === commentId);

      if (commentToUpdate) {
        // Create a deep copy of the comment
        const updatedComment = JSON.parse(JSON.stringify(commentToUpdate));

        // Find and update the reply in the comment
        const replyIndex = updatedComment.replies.findIndex(r => r._id === replyId);

        if (replyIndex !== -1) {
          // Update the reply with the response data
          updatedComment.replies[replyIndex] = {
            ...updatedComment.replies[replyIndex],
            ...response.data,
            text: updatedData.text // Ensure the text is updated
          };

          // Update the comments state
          setComments(prevComments =>
            prevComments.map(comment =>
              comment._id === commentId ? updatedComment : comment
            )
          );

          // Emit socket event for real-time updates
          if (isConnected) {
            emit('updateReply', {
              docId: documentId,
              commentId,
              replyId,
              updatedReply: response.data
            });
          }
        } else {
          console.error('Reply not found in comment:', replyId);
          setError('Failed to update reply. Reply not found.');
        }
      } else {
        console.error('Comment not found in state:', commentId);
        setError('Failed to update reply. Comment not found.');
      }
    } catch (error) {
      console.error('Error updating reply:', error);
      setError('Failed to update reply. Please try again.');
    }
  }, [comments]);

  /**
   * Delete a reply
   * @param {string} commentId - ID of the parent comment
   * @param {string} replyId - ID of the reply to delete
   */
  const handleDeleteReply = useCallback(async (commentId, replyId) => {
    try {
      setError(null);
      console.log('Deleting reply:', replyId, 'from comment:', commentId);

      await axios.delete(`/api/comments/${commentId}/replies/${replyId}`);

      console.log('Reply deleted successfully');

      // Find the comment containing the reply
      const commentToUpdate = comments.find(c => c._id === commentId);

      if (commentToUpdate) {
        // Create a deep copy of the comment
        const updatedComment = JSON.parse(JSON.stringify(commentToUpdate));

        // Remove the reply from the comment
        updatedComment.replies = updatedComment.replies.filter(r => r._id !== replyId);

        // Update the comments state
        setComments(prevComments =>
          prevComments.map(comment =>
            comment._id === commentId ? updatedComment : comment
          )
        );

        // Emit socket event for real-time updates
        if (isConnected) {
          emit('deleteReply', {
            docId: documentId,
            commentId,
            replyId
          });
        }
      } else {
        console.error('Comment not found in state:', commentId);
        setError('Failed to delete reply. Comment not found.');
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
      setError('Failed to delete reply. Please try again.');
    }
  }, [comments]);

  // Filter comments based on active filter
  const filteredComments = comments.filter(comment => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'open') return !comment.isResolved;
    if (activeFilter === 'resolved') return comment.isResolved;
    return true;
  });

  return (
    <div className="comments-panel" role="region" aria-label="Comments panel">
      <div className="comments-header">
        <h2 id="comments-title">Comments</h2>
        <button
          className="close-button"
          onClick={onClose}
          aria-label="Close comments panel"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div className="comments-filter" role="tablist" aria-label="Comment filters">
        <button
          className={`filter-button ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
          role="tab"
          aria-selected={activeFilter === 'all'}
          aria-controls="comments-list"
          id="filter-all"
        >
          All <span className="comment-count">{comments.length}</span>
        </button>
        <button
          className={`filter-button ${activeFilter === 'open' ? 'active' : ''}`}
          onClick={() => setActiveFilter('open')}
          role="tab"
          aria-selected={activeFilter === 'open'}
          aria-controls="comments-list"
          id="filter-open"
        >
          Open <span className="comment-count">{openCount}</span>
        </button>
        <button
          className={`filter-button ${activeFilter === 'resolved' ? 'active' : ''}`}
          onClick={() => setActiveFilter('resolved')}
          role="tab"
          aria-selected={activeFilter === 'resolved'}
          aria-controls="comments-list"
          id="filter-resolved"
        >
          Resolved <span className="comment-count">{resolvedCount}</span>
        </button>
      </div>

      <NewCommentForm onAddComment={handleAddComment} />

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {/* Show loading spinner only when loading comments, not when adding replies */}
      {loading ? (
        <div className="comments-list" aria-live="polite">
          <div className="loading-header">
            <div className="loading-comments-animation">
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
            <div className="loading-text">Loading comments</div>
          </div>

          {/* Skeleton loading for comments */}
          {[1, 2, 3].map(i => (
            <div key={i} className="comment-skeleton">
              <div className="skeleton-header">
                <div className="skeleton-avatar"></div>
                <div className="skeleton-author">
                  <div className="skeleton-name"></div>
                  <div className="skeleton-date"></div>
                </div>
                <div className="skeleton-actions"></div>
              </div>
              <div className="skeleton-content">
                <div className="skeleton-line"></div>
                <div className="skeleton-line"></div>
                <div className="skeleton-line short"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="comments-list"
          id="comments-list"
          role="tabpanel"
          aria-labelledby={`filter-${activeFilter}`}
        >
          {filteredComments.length === 0 ? (
            <div className="no-comments">No comments yet</div>
          ) : (
            filteredComments.map(comment => (
              <CommentItem
                key={comment._id}
                comment={comment}
                currentUser={user}
                isDocumentOwner={isDocumentOwner}
                onUpdateComment={handleUpdateComment}
                onDeleteComment={handleDeleteComment}
                onAddReply={handleAddReply}
                onUpdateReply={handleUpdateReply}
                onDeleteReply={handleDeleteReply}
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

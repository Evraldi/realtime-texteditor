import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { removeShare, updateSharePermission } from '../../services/sharingService';
import { getDocument } from '../../services/documentService';
import { useAuth } from '../../context/AuthContext';
import { STORAGE_KEYS } from '../../config/constants';
import './ShareDialog.css';

// Define keyframes for spinner animation
const spinKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Add style tag to head
if (!document.getElementById('share-dialog-keyframes')) {
  const styleTag = document.createElement('style');
  styleTag.id = 'share-dialog-keyframes';
  styleTag.innerHTML = spinKeyframes;
  document.head.appendChild(styleTag);
}

/**
 * ShareDialog component for sharing documents with other users
 */
const ShareDialog = ({ isOpen, onClose, documentId, documentTitle, onShare }) => {
  const { user: currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('view');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [sharedUsers, setSharedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [documentData, setDocumentData] = useState(null);

  // Generate shareable link
  const shareableLink = `${window.location.origin}/documents/shared/${documentId}`;

  // Fetch users with whom the document is shared
  const fetchSharedUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);

      // Get the document with shared users
      const doc = await getDocument(documentId);

      // Store the document for permission checks
      setDocumentData(doc);

      // Extract shared users from document
      const users = doc && doc.sharedWith ? doc.sharedWith : [];

      // Update state with shared users
      setSharedUsers(users);
    } catch (err) {
      console.error('Error fetching shared users:', err);
      // Don't show error to user, just log it
      setSharedUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [documentId]);

  // Fetch shared users when dialog opens
  useEffect(() => {
    if (isOpen && documentId) {
      fetchSharedUsers();
    }
  }, [isOpen, documentId, fetchSharedUsers]);

  // Re-fetch shared users when document changes
  useEffect(() => {
    if (isOpen && documentId) {
      const intervalId = setInterval(() => {
        fetchSharedUsers();
      }, 5000); // Refresh every 5 seconds

      return () => clearInterval(intervalId);
    }
  }, [isOpen, documentId, fetchSharedUsers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    try {
      setIsLoading(true);
      await onShare(documentId, email, permission);
      setSuccessMessage(`Document shared with ${email} successfully!`);
      setEmail('');
      // Refresh the list of shared users
      await fetchSharedUsers();
    } catch (err) {
      setError(err.message || 'Failed to share document');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle removing share access
  const handleRemoveShare = async (shareId) => {
    try {
      setIsLoading(true);
      setError('');
      await removeShare(documentId, shareId);
      setSuccessMessage('Share access removed successfully');
      // Refresh the list of shared users
      await fetchSharedUsers();
    } catch (err) {
      setError(err.message || 'Failed to remove share access');
    } finally {
      setIsLoading(false);
    }
  };

  // State to track which share is being updated
  const [updatingShareId, setUpdatingShareId] = useState(null);

  const handlePermissionChange = async (shareId, newPermission) => {
    console.log('handlePermissionChange:', { shareId, newPermission });

    // Prevent multiple clicks
    if (updatingShareId) {
      console.log('Already updating a permission, ignoring click');
      return;
    }

    try {
      setUpdatingShareId(shareId);
      setError('');

      console.log('Setting updatingShareId:', shareId);

      // Visual feedback - use permission-badge-clickable
      const badge = document.querySelector(`[data-share-id="${shareId}"] .permission-badge-clickable`);
      console.log('Found badge element:', badge);

      if (badge) {
        badge.style.transform = 'scale(0.95)';
        setTimeout(() => {
          badge.style.transform = '';
        }, 200);
      }

      console.log('Calling updateSharePermission with params:', { documentId, shareId, newPermission });
      const result = await updateSharePermission(documentId, shareId, newPermission);
      console.log('Permission update result:', result);
      console.log('Permission updated, fetching users');

      await fetchSharedUsers();
      setSuccessMessage(`Permission updated to "${newPermission === 'edit' ? 'Can edit' : 'Can view'}"`);

      // Highlight row
      const userRow = document.querySelector(`[data-share-id="${shareId}"]`);
      if (userRow) {
        console.log('Adding highlight-update class to row');
        userRow.classList.add('highlight-update');
        setTimeout(() => {
          userRow.classList.remove('highlight-update');
        }, 2000);
      }
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message || 'Failed to update permission');
    } finally {
      console.log('Clearing updatingShareId');
      setUpdatingShareId(null);
    }
  };

  // Check if current user is the document owner
  const isDocumentOwner = useCallback(() => {
    // Avoid excessive logging
    // console.log('isDocumentOwner check:');
    // console.log('documentData:', documentData);
    // console.log('currentUser:', currentUser);

    if (!documentData) {
      // console.log('documentData is null, returning false');
      return false;
    }

    // Get current user ID with fallbacks
    let userObj = currentUser;

    // Try to get user ID from token if currentUser._id is undefined
    if (!userObj || !userObj._id) {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
                     sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

        if (token) {
          // Try to decode JWT token to get user ID
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            if (payload.userId || payload.sub) {
              userObj = { _id: payload.userId || payload.sub };
              // console.log('User ID extracted from token:', userObj._id);
            }
          }
        }
      } catch (error) {
        console.error('Error extracting user ID from token:', error);
      }
    }

    // console.log('documentData.createdBy:', documentData.createdBy);
    // console.log('documentData.createdBy._id:', documentData.createdBy?._id);
    // console.log('userObj._id:', userObj?._id);

    // Get document creator ID
    const documentOwnerId = documentData.createdBy?._id || documentData.createdBy || '';
    const currentUserId = userObj?._id || userObj?.id || '';

    // console.log('documentOwnerId:', documentOwnerId);
    // console.log('currentUserId:', currentUserId);

    // Compare as strings to handle different types (ObjectId vs String)
    const isOwner = documentOwnerId && currentUserId &&
                   String(documentOwnerId) === String(currentUserId);

    // console.log('isOwner result:', isOwner);
    return isOwner;
  }, [documentData, currentUser]);

  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(shareableLink)
      .then(() => {
        setSuccessMessage('Link copied to clipboard!');
        setTimeout(() => setSuccessMessage(''), 3000);
      })
      .catch(() => {
        setError('Failed to copy link');
      });
  };

  // Clear messages after a delay
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Clear error after a delay
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Close dropdown when clicking outside
  useEffect(() => {
    // Only add event listener if dialog is open
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      // Use document.querySelectorAll to get all dropdowns
      const dropdowns = document.querySelectorAll('.permission-dropdown');
      if (!dropdowns || dropdowns.length === 0) return;

      dropdowns.forEach(dropdown => {
        // Check if dropdown is visible and click is outside
        if (dropdown.style.display === 'block' &&
            !dropdown.contains(event.target) &&
            !event.target.classList.contains('permission-badge-clickable')) {
          dropdown.style.display = 'none';
        }
      });
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="share-dialog-overlay">
      <div className="share-dialog">
        <div className="modal-header">
          <h3>Share "{documentTitle}"</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-danger">{error}</div>}
          {successMessage && <div className="alert alert-success">{successMessage}</div>}

          <div className="share-link-section">
            <h4>Share via Link</h4>
            <div className="share-link-input">
              <input
                type="text"
                value={shareableLink}
                readOnly
                className="form-control"
                aria-label="Shareable link"
              />
              <button
                className="btn btn-outline-primary"
                onClick={copyLinkToClipboard}
                aria-label="Copy link"
              >
                Copy
              </button>
            </div>
            <p className="share-link-info">
              Anyone with this link {documentData?.isPublic ? 'can view' : 'who has been given access can collaborate on'} this document
            </p>
          </div>

          <div className="share-email-section">
            <h4>Share with Specific People</h4>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="form-control"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="permission">Permission</label>
                <select
                  id="permission"
                  value={permission}
                  onChange={(e) => setPermission(e.target.value)}
                  className="form-control"
                  disabled={isLoading}
                >
                  <option value="view">Can view</option>
                  <option value="edit">Can edit</option>
                </select>
                <small className="permission-help-text">
                  <strong>Can view:</strong> User can read but not edit the document<br />
                  <strong>Can edit:</strong> User can make changes to the document
                </small>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Sharing...' : 'Share'}
              </button>
            </form>
          </div>

          {/* Shared users list */}
          <div className="shared-users-list">
            <h4>
              People with Access
              {documentData && documentData.createdBy && (
                <span className="owner-info">
                  Owner: {documentData.createdBy.displayName || documentData.createdBy.email}
                </span>
              )}
            </h4>
            {loadingUsers ? (
              <div className="text-center p-3">Loading...</div>
            ) : sharedUsers && sharedUsers.length > 0 ? (
              sharedUsers.map((share) => {
                // Skip if share or user is undefined
                if (!share || !share.user) return null;

                return (
                  <div key={share._id} className="shared-user-item" data-share-id={share._id}>
                    <div className="shared-user-info">
                      <div className="shared-user-avatar">
                        {share.user.displayName?.charAt(0) || share.user.email?.charAt(0) || '?'}
                      </div>
                      <div className="shared-user-details">
                        <span className="shared-user-email">
                          {share.user.displayName || share.user.email}
                          {currentUser && share.user._id === currentUser._id && (
                            <span className="user-badge">You</span>
                          )}
                        </span>
                        <div className="shared-user-permission">
                          <span className="permission-label">Permission:</span>
                          {isDocumentOwner() ? (
                            <div className="permission-dropdown-container">
                              <div
                                className={`permission-badge-clickable ${share.permission} ${updatingShareId === share._id ? 'updating' : ''}`}
                                onClick={(e) => {
                                  if (updatingShareId === share._id) return;
                                  const dropdown = e.currentTarget.nextElementSibling;
                                  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                                }}
                                title="Click to change permission"
                              >
                                <span className="badge-text">
                                  {share.permission === 'edit' ? 'Can edit' : 'Can view'}
                                </span>
                                {updatingShareId === share._id ? (
                                  <span className="badge-spinner"></span>
                                ) : (
                                  <span className="badge-arrow">▼</span>
                                )}
                              </div>
                              <div className="permission-dropdown">
                                <div
                                  className={`dropdown-item ${share.permission === 'view' ? 'active view' : ''}`}
                                  onClick={(e) => {
                                    if (share.permission !== 'view' && updatingShareId !== share._id) {
                                      handlePermissionChange(share._id, 'view');
                                      e.currentTarget.parentElement.style.display = 'none';
                                    }
                                  }}
                                >
                                  Can view
                                </div>
                                <div
                                  className={`dropdown-item ${share.permission === 'edit' ? 'active edit' : ''}`}
                                  onClick={(e) => {
                                    if (share.permission !== 'edit' && updatingShareId !== share._id) {
                                      handlePermissionChange(share._id, 'edit');
                                      e.currentTarget.parentElement.style.display = 'none';
                                    }
                                  }}
                                >
                                  Can edit
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className={`permission-badge ${share.permission}`}>
                              {share.permission === 'edit' ? 'Can edit' : 'Can view'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="shared-user-actions">
                      {isDocumentOwner() && (
                        <button
                          type="button"
                          onClick={() => handleRemoveShare(share._id)}
                          title="Remove access"
                          disabled={isLoading}
                          aria-label="Remove access"
                          className="remove-access-btn"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-users-message">No users have been given access yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

ShareDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  documentId: PropTypes.string.isRequired,
  documentTitle: PropTypes.string.isRequired,
  onShare: PropTypes.func.isRequired
};

export default ShareDialog;

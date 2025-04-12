import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { removeShare } from '../../services/sharingService';
import { getDocument } from '../../services/documentService';
import './ShareDialog.css';

/**
 * ShareDialog component for sharing documents with other users
 */
const ShareDialog = ({ isOpen, onClose, documentId, documentTitle, onShare }) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('view');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [sharedUsers, setSharedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Generate shareable link
  const shareableLink = `${window.location.origin}/documents/shared/${documentId}`;

  // Fetch users with whom the document is shared
  const fetchSharedUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);

      // Get the document with shared users
      const document = await getDocument(documentId);
      console.log('Document data for shared users:', document);

      // Extract shared users from document
      const users = document && document.sharedWith ? document.sharedWith : [];
      console.log('Shared users data:', users);

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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content share-dialog">
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
              />
              <button
                className="btn btn-outline-primary"
                onClick={copyLinkToClipboard}
              >
                Copy
              </button>
            </div>
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
            <h4>People with Access</h4>
            {loadingUsers ? (
              <div className="text-center p-3">Loading...</div>
            ) : sharedUsers && sharedUsers.length > 0 ? (
              sharedUsers.map((share) => {
                // Skip if share or user is undefined
                if (!share || !share.user) return null;

                return (
                  <div key={share._id} className="shared-user-item">
                    <div className="shared-user-info">
                      <div className="shared-user-avatar">
                        {share.user.displayName?.charAt(0) || share.user.email?.charAt(0) || '?'}
                      </div>
                      <div className="shared-user-details">
                        <span className="shared-user-email">
                          {share.user.displayName || share.user.email}
                        </span>
                        <span className="shared-user-permission">
                          {share.permission === 'edit' ? 'Can edit' : 'Can view'}
                        </span>
                      </div>
                    </div>
                    <div className="shared-user-actions">
                      <button
                        type="button"
                        onClick={() => handleRemoveShare(share._id)}
                        title="Remove access"
                        disabled={isLoading}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center p-3">No users have been given access yet.</div>
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

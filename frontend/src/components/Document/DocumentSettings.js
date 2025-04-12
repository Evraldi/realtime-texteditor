import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * DocumentSettings component for managing document settings
 */
const DocumentSettings = ({ isOpen, onClose, document, onUpdate }) => {
  const [title, setTitle] = useState(document?.title || '');
  const [isPublic, setIsPublic] = useState(document?.isPublic || false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!title.trim()) {
      setError('Document title is required');
      return;
    }

    try {
      setIsLoading(true);
      await onUpdate(document._id, { title, isPublic });
      setSuccessMessage('Document settings updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update document settings');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !document) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content settings-dialog">
        <div className="modal-header">
          <h3>Document Settings</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-danger">{error}</div>}
          {successMessage && <div className="alert alert-success">{successMessage}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Document Title</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title"
                className="form-control"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  disabled={isLoading}
                />
                <span className="checkbox-text">Make document public</span>
              </label>
              <div className="form-text">
                Public documents can be accessed by anyone with the link, without requiring login.
              </div>
            </div>

            <div className="form-group">
              <h4>Document Information</h4>
              <div className="document-info-grid">
                <div className="info-label">Created:</div>
                <div className="info-value">{new Date(document.createdAt).toLocaleString()}</div>
                
                <div className="info-label">Last Modified:</div>
                <div className="info-value">{new Date(document.updatedAt).toLocaleString()}</div>
                
                <div className="info-label">Owner:</div>
                <div className="info-value">{document.createdBy?.email || 'Unknown'}</div>
                
                <div className="info-label">Document ID:</div>
                <div className="info-value document-id">{document._id}</div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

DocumentSettings.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  document: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    isPublic: PropTypes.bool,
    createdAt: PropTypes.string.isRequired,
    updatedAt: PropTypes.string.isRequired,
    createdBy: PropTypes.shape({
      _id: PropTypes.string,
      email: PropTypes.string
    })
  }),
  onUpdate: PropTypes.func.isRequired
};

export default DocumentSettings;

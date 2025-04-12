import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDocuments, createDocument, deleteDocument, updateDocument } from '../../services/documentService';
import Loading from '../UI/Loading';
import ErrorMessage from '../UI/ErrorMessage';
import ConfirmationDialog from '../UI/ConfirmationDialog';

/**
 * Document list component
 * @returns {JSX.Element} Document list component
 */
const DocumentList = () => {
  // State
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Document deletion state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);

  // Document renaming state
  const [editingDocId, setEditingDocId] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  // Hooks
  const navigate = useNavigate();

  // Fetch documents on component mount
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const docs = await getDocuments();
        setDocuments(docs);
        setError('');
      } catch (err) {
        console.error('Failed to fetch documents:', err);
        setError('Failed to load documents. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  /**
   * Handle creating a new document
   */
  const handleCreateDocument = async () => {
    try {
      setLoading(true);
      setError('');

      // Create a new document with default title
      const newDoc = await createDocument('', 'Untitled Document');

      if (newDoc && newDoc._id) {
        navigate(`/editor/${newDoc._id}`);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Failed to create document:', err);
      setError(`Failed to create a new document: ${err.message || 'Please try again.'}`);
      setLoading(false);
    }
  };

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Get document preview text
   * @param {string} content - Document content
   * @returns {string} Preview text
   */
  const getPreviewText = (content) => {
    if (!content) return 'Empty document';
    return content.substring(0, 100) + (content.length > 100 ? '...' : '');
  };

  /**
   * Handle document deletion confirmation
   * @param {Object} doc - Document to delete
   */
  const handleDeleteConfirmation = (doc) => {
    setDocumentToDelete(doc);
    setShowDeleteConfirmation(true);
  };

  /**
   * Handle document deletion
   */
  const handleDeleteDocument = async () => {
    if (!documentToDelete || !documentToDelete._id) return;

    try {
      setLoading(true);
      await deleteDocument(documentToDelete._id);

      // Update documents list
      setDocuments(prevDocs =>
        prevDocs.filter(doc => doc._id !== documentToDelete._id)
      );

      setSuccessMessage(`Document "${documentToDelete.title || 'Untitled'}" deleted successfully`);
      setShowDeleteConfirmation(false);
      setDocumentToDelete(null);
    } catch (err) {
      console.error('Failed to delete document:', err);
      setError(`Failed to delete document: ${err.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Start editing document title
   * @param {Object} doc - Document to rename
   */
  const startEditingTitle = (doc) => {
    setEditingDocId(doc._id);
    setNewTitle(doc.title || 'Untitled Document');
  };

  /**
   * Save document title
   * @param {string} docId - Document ID
   */
  const saveDocumentTitle = async (docId) => {
    if (!docId || !newTitle.trim()) {
      setEditingDocId(null);
      return;
    }

    try {
      setLoading(true);
      await updateDocument(docId, { title: newTitle.trim() });

      // Update documents list
      setDocuments(prevDocs =>
        prevDocs.map(doc =>
          doc._id === docId ? { ...doc, title: newTitle.trim() } : doc
        )
      );

      setSuccessMessage('Document title updated successfully');
    } catch (err) {
      console.error('Failed to update document title:', err);
      setError(`Failed to update document title: ${err.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
      setEditingDocId(null);
    }
  };

  return (
    <div className="container">
      <div className="document-list-container">
        <div className="document-list-header">
          <h2 className="document-list-title">Your Documents</h2>
          <button
            className="btn btn-primary"
            onClick={handleCreateDocument}
            disabled={loading}
          >
            Create New Document
          </button>
        </div>

        {error && (
          <ErrorMessage
            message={error}
            onDismiss={() => setError('')}
          />
        )}

        {successMessage && (
          <ErrorMessage
            type="success"
            message={successMessage}
            onDismiss={() => setSuccessMessage('')}
          />
        )}

        {loading ? (
          <Loading message="Loading documents..." />
        ) : documents.length === 0 ? (
          <div className="text-center p-5">
            <p className="mb-4">You don't have any documents yet.</p>
            <button
              className="btn btn-primary"
              onClick={handleCreateDocument}
            >
              Create Your First Document
            </button>
          </div>
        ) : (
          <div className="document-grid">
            {documents.map((doc) => (
              <div className="document-card" key={doc._id}>
                <div className="document-card-header">
                  {editingDocId === doc._id ? (
                    <div className="document-title-edit">
                      <input
                        type="text"
                        className="title-input"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveDocumentTitle(doc._id)}
                        autoFocus
                      />
                      <div className="title-edit-actions">
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => saveDocumentTitle(doc._id)}
                          title="Save title"
                        >
                          ✓
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => setEditingDocId(null)}
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="document-title-display">
                      <h3 className="document-card-title">
                        {doc.title || `Document ${doc._id.substring(0, 8)}`}
                      </h3>
                      <button
                        className="btn btn-sm btn-icon"
                        onClick={() => startEditingTitle(doc)}
                        title="Edit title"
                      >
                        ✎
                      </button>
                    </div>
                  )}
                </div>
                <div className="document-card-content">
                  <p className="document-card-preview">
                    {getPreviewText(doc.content)}
                  </p>
                </div>
                <div className="document-card-footer">
                  <span className="document-card-date">
                    {formatDate(doc.updatedAt || doc.createdAt)}
                  </span>
                  <div className="document-card-actions">
                    <Link
                      to={`/editor/${doc._id}`}
                      className="btn btn-sm btn-primary"
                      title="Open document"
                    >
                      Open
                    </Link>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteConfirmation(doc)}
                      title="Delete document"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Create new document card */}
            <div
              className="create-document-card"
              onClick={handleCreateDocument}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateDocument()}
            >
              <div className="create-document-icon">+</div>
              <div className="create-document-text">Create New Document</div>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        title="Delete Document"
        message={`Are you sure you want to delete "${documentToDelete?.title || 'this document'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteDocument}
        onCancel={() => {
          setShowDeleteConfirmation(false);
          setDocumentToDelete(null);
        }}
        type="danger"
      />
    </div>
  );
};

export default DocumentList;

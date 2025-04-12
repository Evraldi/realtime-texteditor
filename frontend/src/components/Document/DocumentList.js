import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDocuments, createDocument, deleteDocument, updateDocument } from '../../services/documentService';
import Loading from '../UI/Loading';
import ErrorMessage from '../UI/ErrorMessage';
import ConfirmationDialog from '../UI/ConfirmationDialog';

// No need to import additional styles as they're already in global.css

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

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');

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

        // Check if it's an authentication error
        if (err.message && err.message.includes('Session expired')) {
          // Use a more user-friendly error message
          setError('Your session has expired. Please refresh the page or log in again.');
        } else {
          setError('Failed to load documents. Please try again.');
        }
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

      // Check if it's an authentication error
      if (err.message && err.message.includes('Session expired')) {
        // Use a more user-friendly error message
        setError('Your session has expired. Please refresh the page or log in again.');
      } else {
        setError(`Failed to create a new document: ${err.message || 'Please try again.'}`);
      }
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

      // Check if it's an authentication error
      if (err.message && err.message.includes('Session expired')) {
        // Use a more user-friendly error message
        setError('Your session has expired. Please refresh the page or log in again.');
      } else {
        setError(`Failed to delete document: ${err.message || 'Please try again.'}`);
      }
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

      // Check if it's an authentication error
      if (err.message && err.message.includes('Session expired')) {
        // Use a more user-friendly error message
        setError('Your session has expired. Please refresh the page or log in again.');
      } else {
        setError(`Failed to update document title: ${err.message || 'Please try again.'}`);
      }
    } finally {
      setLoading(false);
      setEditingDocId(null);
    }
  };

  // Filter and sort documents based on search term and sort options
  const filteredDocuments = useMemo(() => {
    if (!documents.length) return [];

    // First filter by search term
    let filtered = documents;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = documents.filter(doc =>
        (doc.title || '').toLowerCase().includes(term) ||
        (doc.content || '').toLowerCase().includes(term)
      );
    }

    // Then sort
    return [...filtered].sort((a, b) => {
      let aValue, bValue;

      // Determine values to compare based on sortBy
      switch (sortBy) {
        case 'title':
          aValue = (a.title || '').toLowerCase();
          bValue = (b.title || '').toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        case 'updatedAt':
        default:
          aValue = new Date(a.updatedAt || a.createdAt || 0).getTime();
          bValue = new Date(b.updatedAt || b.createdAt || 0).getTime();
      }

      // Apply sort order
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [documents, searchTerm, sortBy, sortOrder]);

  /**
   * Handle search input change
   * @param {Event} e - Input change event
   */
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  /**
   * Handle sort change
   * @param {Event} e - Select change event
   */
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  /**
   * Toggle sort order
   */
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="document-list-container">
      <div className="document-list-header">
        <h2 className="document-list-title">Your Documents</h2>
        <button
          className="btn btn-create"
          onClick={handleCreateDocument}
          disabled={loading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span className="btn-text">Create New Document</span>
        </button>
      </div>

      {/* Search and filter controls */}
      <div className="document-controls" role="search" aria-label="Document search and filter options">
        <div className="search-bar">
          <div className="search-input-container">
            <span className="search-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input
              id="document-search"
              type="search"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={handleSearchChange}
              disabled={loading}
              aria-label="Search documents"
              autoComplete="off"
            />
            {searchTerm && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
                title="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="filter-controls">
          <div className="filter-dropdown">
            <select
              id="sort-select"
              value={sortBy}
              onChange={handleSortChange}
              disabled={loading}
              aria-label="Sort documents by"
            >
              <option value="updatedAt">Last Modified</option>
              <option value="createdAt">Date Created</option>
              <option value="title">Title</option>
            </select>
          </div><button
            className="sort-order-btn"
            onClick={toggleSortOrder}
            aria-label={sortOrder === 'asc' ? 'Sort ascending' : 'Sort descending'}
            title={sortOrder === 'asc' ? 'Ascending order' : 'Descending order'}
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {sortOrder === 'asc' ? (
                <>
                  <line x1="12" y1="19" x2="12" y2="5"></line>
                  <polyline points="5 12 12 5 19 12"></polyline>
                </>
              ) : (
                <>
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <polyline points="19 12 12 19 5 12"></polyline>
                </>
              )}
            </svg>
          </button>
        </div>
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
      ) : filteredDocuments.length === 0 && searchTerm ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <h3 className="empty-title">No matching documents</h3>
          <p className="empty-desc">We couldn't find any documents matching your search. Try different keywords or clear your search.</p>
          <button
            className="btn btn-primary"
            onClick={() => setSearchTerm('')}
          >
            Clear Search
          </button>
        </div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
          </div>
          <h3 className="empty-title">No documents yet</h3>
          <p className="empty-desc">You don't have any documents yet. Create your first document to get started!</p>
          <button
            className="btn btn-primary"
            onClick={handleCreateDocument}
          >
            Create Your First Document
          </button>
        </div>
      ) : (
        <div className="document-grid">
          {filteredDocuments.map((doc) => (
            <article className="document-card" key={doc._id}>
              <div className={`document-card-header ${editingDocId === doc._id ? 'editing' : ''}`}>
                {editingDocId === doc._id ? (
                  <div className="document-title-edit">
                    <span className="edit-title-label">Edit document title</span>
                    <input
                      id={`title-input-${doc._id}`}
                      type="text"
                      className="title-input"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveDocumentTitle(doc._id)}
                      maxLength={100}
                      autoFocus
                      aria-label="Document title"
                    />
                    <div className="title-edit-actions">
                      <button
                        className="btn btn-success"
                        onClick={() => saveDocumentTitle(doc._id)}
                        title="Save title"
                        aria-label="Save document title"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setEditingDocId(null)}
                        title="Cancel"
                        aria-label="Cancel editing"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
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
                      aria-label="Edit document title"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <div className="document-card-content">
                <p className="document-card-preview">
                  {getPreviewText(doc.content)}
                </p>
                <div className="document-card-meta">
                  <span className="document-card-words" title="Word count">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    {doc.content ? doc.content.split(/\s+/).filter(Boolean).length : 0} words
                  </span>
                </div>
              </div>
              <div className="document-card-footer">
                <span className="document-card-date" title={`Last modified: ${new Date(doc.updatedAt || doc.createdAt).toLocaleString()}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  {formatDate(doc.updatedAt || doc.createdAt)}
                </span>
                <div className="document-card-actions">
                  <Link
                    to={`/editor/${doc._id}`}
                    className="btn btn-primary"
                    title="Open document"
                    aria-label={`Open document: ${doc.title || 'Untitled'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                    Open
                  </Link>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDeleteConfirmation(doc)}
                    title="Delete document"
                    aria-label={`Delete document: ${doc.title || 'Untitled'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
          <article
            className="create-document-card"
            onClick={handleCreateDocument}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateDocument()}
            aria-label="Create new document"
          >
            <div className="create-document-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <div className="create-document-text">Create New Document</div>
            <div className="create-document-description">Start writing a new document from scratch</div>
          </article>
        </div>
      )}

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

import { get, post, put, del } from './apiService';

/**
 * Get all documents
 * @returns {Promise<Array>} List of documents
 */
export const getDocuments = async () => {
  try {
    return await get('/api/documents');
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch documents');
  }
};

/**
 * Get document by ID
 * @param {string} id - Document ID
 * @returns {Promise<Object>} Document data
 */
export const getDocument = async (id) => {
  try {
    if (!id) throw new Error('Document ID is required');
    return await get(`/api/document/${id}`);
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch document');
  }
};

/**
 * Save document
 * @param {string} id - Document ID (optional for new documents)
 * @param {string} content - Document content
 * @returns {Promise<Object>} Saved document data
 */
export const saveDocument = async (id, content) => {
  try {
    // Ensure content is at least an empty string, not null or undefined
    const safeContent = content || '';

    return await post('/api/document', { id, content: safeContent });
  } catch (error) {
    throw new Error(error.message || 'Failed to save document');
  }
};

/**
 * Create new document
 * @param {string} content - Document content
 * @param {string} title - Document title (optional)
 * @returns {Promise<Object>} New document data
 */
export const createDocument = async (content = '', title = 'Untitled Document') => {
  try {
    // Ensure content is at least an empty string, not null or undefined
    const safeContent = content || '';

    // Send title along with content to match backend expectations
    return await post('/api/document', {
      content: safeContent,
      title: title
    });
  } catch (error) {
    console.error('Create document error:', error);
    throw new Error(error.message || 'Failed to create document');
  }
};

/**
 * Delete document by ID
 * @param {string} id - Document ID
 * @returns {Promise<Object>} Response data
 */
export const deleteDocument = async (id) => {
  try {
    if (!id) throw new Error('Document ID is required');
    return await del(`/api/document/${id}`);
  } catch (error) {
    console.error('Delete document error:', error);
    throw new Error(error.message || 'Failed to delete document');
  }
};

/**
 * Update document properties (title, isPublic, etc.)
 * @param {string} id - Document ID
 * @param {Object} data - Document properties to update
 * @returns {Promise<Object>} Updated document data
 */
export const updateDocument = async (id, data) => {
  try {
    if (!id) throw new Error('Document ID is required');
    return await post('/api/document', { id, ...data });
  } catch (error) {
    console.error('Update document error:', error);
    throw new Error(error.message || 'Failed to update document');
  }
};

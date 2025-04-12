import { get, post, put } from './apiService';

/**
 * Get all versions of a document
 * @param {string} documentId - Document ID
 * @returns {Promise<Array>} List of versions
 */
export const getVersions = async (documentId) => {
  try {
    if (!documentId) throw new Error('Document ID is required');
    return await get(`/api/versions/document/${documentId}`);
  } catch (error) {
    console.error('Error fetching versions:', error);
    throw new Error(error.message || 'Failed to fetch document versions');
  }
};

/**
 * Get a specific version of a document
 * @param {string} documentId - Document ID
 * @param {string} versionId - Version ID
 * @returns {Promise<Object>} Version data
 */
export const getVersion = async (documentId, versionId) => {
  try {
    if (!documentId) throw new Error('Document ID is required');
    if (!versionId) throw new Error('Version ID is required');
    return await get(`/api/versions/document/${documentId}/version/${versionId}`);
  } catch (error) {
    console.error('Error fetching version:', error);
    throw new Error(error.message || 'Failed to fetch document version');
  }
};

/**
 * Create a new version of a document
 * @param {string} documentId - Document ID
 * @param {Object} data - Version data (content, title, description)
 * @returns {Promise<Object>} New version data
 */
export const createVersion = async (documentId, data) => {
  try {
    if (!documentId) throw new Error('Document ID is required');
    return await post(`/api/versions/document/${documentId}`, data);
  } catch (error) {
    console.error('Error creating version:', error);
    throw new Error(error.message || 'Failed to create document version');
  }
};

/**
 * Restore a document to a specific version
 * @param {string} documentId - Document ID
 * @param {string} versionId - Version ID to restore
 * @returns {Promise<Object>} Response data
 */
export const restoreVersion = async (documentId, versionId) => {
  try {
    if (!documentId) throw new Error('Document ID is required');
    if (!versionId) throw new Error('Version ID is required');
    return await post(`/api/versions/document/${documentId}/restore/${versionId}`);
  } catch (error) {
    console.error('Error restoring version:', error);
    throw new Error(error.message || 'Failed to restore document version');
  }
};

/**
 * Compare two versions of a document
 * @param {string} documentId - Document ID
 * @param {string} versionId1 - First version ID to compare
 * @param {string} versionId2 - Second version ID to compare
 * @returns {Promise<Object>} Comparison data
 */
export const compareVersions = async (documentId, versionId1, versionId2) => {
  try {
    if (!documentId) throw new Error('Document ID is required');
    if (!versionId1) throw new Error('First version ID is required');
    if (!versionId2) throw new Error('Second version ID is required');
    return await get(`/api/versions/document/${documentId}/compare/${versionId1}/${versionId2}`);
  } catch (error) {
    console.error('Error comparing versions:', error);
    throw new Error(error.message || 'Failed to compare document versions');
  }
};

/**
 * Tag a version (mark as significant, add tags or comments)
 * @param {string} documentId - Document ID
 * @param {string} versionId - Version ID to tag
 * @param {Object} data - Tag data (tags, isSignificant, comment)
 * @returns {Promise<Object>} Updated version data
 */
export const tagVersion = async (documentId, versionId, data) => {
  try {
    if (!documentId) throw new Error('Document ID is required');
    if (!versionId) throw new Error('Version ID is required');
    if (!data) throw new Error('Tag data is required');

    return await put(`/api/versions/document/${documentId}/version/${versionId}/tag`, data);
  } catch (error) {
    console.error('Error tagging version:', error);
    throw new Error(error.message || 'Failed to tag document version');
  }
};

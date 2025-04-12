import { get, post, del } from './apiService';

/**
 * Share a document with another user
 * @param {string} documentId - Document ID
 * @param {string} email - Email of the user to share with
 * @param {string} permission - Permission level ('view' or 'edit')
 * @returns {Promise<Object>} Response data
 */
export const shareDocument = async (documentId, email, permission) => {
  try {
    if (!documentId) throw new Error('Document ID is required');
    if (!email) throw new Error('Email is required');
    if (!['view', 'edit'].includes(permission)) {
      throw new Error('Permission must be "view" or "edit"');
    }

    return await post(`/api/document/${documentId}/share`, { email, permission });
  } catch (error) {
    console.error('Share document error:', error);
    throw new Error(error.message || 'Failed to share document');
  }
};

/**
 * Remove share access for a user
 * @param {string} documentId - Document ID
 * @param {string} shareId - Share ID to remove
 * @returns {Promise<Object>} Response data
 */
export const removeShare = async (documentId, shareId) => {
  try {
    if (!documentId) throw new Error('Document ID is required');
    if (!shareId) throw new Error('Share ID is required');

    return await del(`/api/document/${documentId}/share/${shareId}`);
  } catch (error) {
    console.error('Remove share error:', error);
    throw new Error(error.message || 'Failed to remove share access');
  }
};

/**
 * Get all users with access to a document
 * @param {string} documentId - Document ID
 * @returns {Promise<Array>} List of users with access
 */
export const getSharedUsers = async (documentId) => {
  try {
    if (!documentId) throw new Error('Document ID is required');

    // This information is included in the document object
    // We'll extract it from the document data
    const document = await get(`/api/document/${documentId}`);

    if (!document || !document.sharedWith) {
      return [];
    }

    return document.sharedWith;
  } catch (error) {
    console.error('Get shared users error:', error);
    throw new Error(error.message || 'Failed to get shared users');
  }
};

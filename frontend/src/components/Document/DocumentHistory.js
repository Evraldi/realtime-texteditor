import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { formatDate, getRelativeTimeString } from '../../utils/dateUtils';
import { getVersions, getVersion, restoreVersion, compareVersions, tagVersion } from '../../services/versionService';
import './DocumentHistory.css';

/**
 * DocumentHistory component displays the revision history of a document
 */
const DocumentHistory = ({ isOpen, onClose, documentId, onRestoreVersion }) => {
  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [versionContent, setVersionContent] = useState('');

  // Version comparison state
  const [compareMode, setCompareMode] = useState(false);
  const [versionToCompare, setVersionToCompare] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);

  // Version tagging state
  const [tagMode, setTagMode] = useState(false);
  const [versionTags, setVersionTags] = useState([]);
  const [isSignificant, setIsSignificant] = useState(false);
  const [versionComment, setVersionComment] = useState('');

  // Fetch document history when opened
  useEffect(() => {
    if (isOpen && documentId) {
      fetchDocumentHistory();
    }
  }, [isOpen, documentId]);

  const fetchDocumentHistory = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Fetch versions from the API
      const fetchedVersions = await getVersions(documentId);

      // Mark the latest version as current
      if (fetchedVersions && fetchedVersions.length > 0) {
        // Sort by version number in descending order
        const sortedVersions = [...fetchedVersions].sort((a, b) =>
          (b.versionNumber || 0) - (a.versionNumber || 0)
        );

        // Mark the latest version as current
        sortedVersions[0].isCurrent = true;

        setVersions(sortedVersions);

        // Select the latest version by default
        setSelectedVersion(sortedVersions[0]);
      } else {
        setVersions([]);
      }
    } catch (err) {
      setError('Failed to load document history');
      console.error('Error fetching document history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreVersion = async () => {
    if (!selectedVersion || !selectedVersion._id) return;

    try {
      setIsLoading(true);
      await restoreVersion(documentId, selectedVersion._id);

      // Call the parent component's callback if provided
      if (typeof onRestoreVersion === 'function') {
        await onRestoreVersion(documentId, selectedVersion._id);
      }

      setSuccessMessage(`Document restored to version ${selectedVersion.versionNumber || 'selected'}`);
      onClose();
    } catch (err) {
      setError(`Failed to restore version: ${err.message || 'Please try again'}`);
      console.error('Error restoring version:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewVersion = async (version) => {
    // If in compare mode, set this as the version to compare with
    if (compareMode && selectedVersion) {
      setVersionToCompare(version);
      await handleCompareVersions(selectedVersion, version);
      return;
    }

    // Exit compare mode if it was active
    if (compareMode) {
      setCompareMode(false);
      setComparisonResult(null);
    }

    // Set the selected version
    setSelectedVersion(version);

    // If in tag mode, initialize tag form with version data
    if (tagMode) {
      setVersionTags(version.tags || []);
      setIsSignificant(version.isSignificant || false);
      setVersionComment(version.comment || '');
    }

    // Only fetch content if we don't already have this version selected
    if (selectedVersion?._id !== version._id) {
      try {
        // Fetch the full version details including content
        const versionDetails = await getVersion(documentId, version._id);
        if (versionDetails && versionDetails.content) {
          setVersionContent(versionDetails.content);
        }
      } catch (err) {
        console.error('Error fetching version details:', err);
        // Don't show error to user, just log it
      }
    }
  };

  /**
   * Compare two versions of a document
   * @param {Object} version1 - First version to compare
   * @param {Object} version2 - Second version to compare
   */
  const handleCompareVersions = async (version1, version2) => {
    if (!version1 || !version2 || !version1._id || !version2._id) {
      setError('Please select two versions to compare');
      return;
    }

    try {
      setIsLoading(true);
      const result = await compareVersions(documentId, version1._id, version2._id);
      setComparisonResult(result);
    } catch (err) {
      setError(`Failed to compare versions: ${err.message || 'Please try again'}`);
      console.error('Error comparing versions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toggle compare mode
   */
  const toggleCompareMode = () => {
    setCompareMode(prevMode => !prevMode);
    if (!compareMode) {
      setVersionToCompare(null);
      setComparisonResult(null);
    }
  };

  /**
   * Toggle tag mode
   */
  const toggleTagMode = () => {
    setTagMode(prevMode => !prevMode);
    if (!tagMode && selectedVersion) {
      // Initialize form with current version data
      setVersionTags(selectedVersion.tags || []);
      setIsSignificant(selectedVersion.isSignificant || false);
      setVersionComment(selectedVersion.comment || '');
    }
  };

  /**
   * Save version tags and metadata
   */
  const handleSaveVersionTags = async () => {
    if (!selectedVersion || !selectedVersion._id) {
      setError('No version selected');
      return;
    }

    try {
      setIsLoading(true);

      const tagData = {
        tags: versionTags,
        isSignificant,
        comment: versionComment
      };

      await tagVersion(documentId, selectedVersion._id, tagData);

      // Update the version in the list
      setVersions(prevVersions =>
        prevVersions.map(v =>
          v._id === selectedVersion._id
            ? { ...v, tags: versionTags, isSignificant, comment: versionComment }
            : v
        )
      );

      // Update selected version
      setSelectedVersion(prev => ({
        ...prev,
        tags: versionTags,
        isSignificant,
        comment: versionComment
      }));

      setSuccessMessage('Version tags updated successfully');
      setTagMode(false);
    } catch (err) {
      setError(`Failed to update version tags: ${err.message || 'Please try again'}`);
      console.error('Error updating version tags:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content history-dialog">
        <div className="modal-header">
          <h3>Document History</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-danger">{error}</div>}
          {successMessage && <div className="alert alert-success">{successMessage}</div>}

          {isLoading ? (
            <div className="loading-indicator">
              <div className="loading-spinner"></div>
              <span>Loading document history...</span>
            </div>
          ) : (
            <div className="history-container">
              <div className="version-list">
                <div className="version-list-header">
                  <h4>Versions</h4>
                  <div className="version-actions">
                    <button
                      className={`btn btn-sm ${compareMode ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={toggleCompareMode}
                      title={compareMode ? 'Exit compare mode' : 'Compare versions'}
                    >
                      {compareMode ? 'Exit Compare' : 'Compare'}
                    </button>
                    {selectedVersion && (
                      <button
                        className={`btn btn-sm ${tagMode ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={toggleTagMode}
                        title={tagMode ? 'Cancel tagging' : 'Tag this version'}
                      >
                        {tagMode ? 'Cancel Tag' : 'Tag'}
                      </button>
                    )}
                  </div>
                </div>

                {compareMode && (
                  <div className="compare-mode-info">
                    {selectedVersion ? (
                      <p>Select another version to compare with <strong>Version {selectedVersion.versionNumber}</strong></p>
                    ) : (
                      <p>Select a version to start comparison</p>
                    )}
                  </div>
                )}

                {versions.length === 0 ? (
                  <p className="no-versions">No version history available</p>
                ) : (
                  <ul className="version-items">
                    {versions.map(version => (
                      <li
                        key={version._id}
                        className={`version-item
                          ${selectedVersion?._id === version._id ? 'selected' : ''}
                          ${version.isCurrent ? 'current' : ''}
                          ${version.isSignificant ? 'significant' : ''}
                          ${versionToCompare?._id === version._id ? 'compare-target' : ''}
                        `}
                        onClick={() => handleViewVersion(version)}
                      >
                        <div className="version-header">
                          <span className="version-number">Version {version.versionNumber || version.version}</span>
                          <div className="version-badges">
                            {version.isCurrent && <span className="current-badge">Current</span>}
                            {version.isSignificant && <span className="significant-badge">Important</span>}
                          </div>
                        </div>
                        <div className="version-meta">
                          <div className="version-time">{formatDate(version.createdAt)}</div>
                          <div className="version-author">By {version.createdBy?.username || (version.createdBy?.email && version.createdBy.email.split('@')[0]) || 'Unknown'}</div>
                        </div>
                        <div className="version-description">{version.description || 'No description'}</div>

                        {/* Show change statistics if available */}
                        {version.changes && (
                          <div className="version-changes-stats">
                            {version.changes.addedChars > 0 && (
                              <span className="change-stat added">+{version.changes.addedChars}</span>
                            )}
                            {version.changes.removedChars > 0 && (
                              <span className="change-stat removed">-{version.changes.removedChars}</span>
                            )}
                            {version.changes.changedLines > 0 && (
                              <span className="change-stat modified">{version.changes.changedLines} lines</span>
                            )}
                          </div>
                        )}

                        {version.tags && version.tags.length > 0 && (
                          <div className="version-tags">
                            {version.tags.map(tag => (
                              <span key={tag} className="version-tag">{tag}</span>
                            ))}
                          </div>
                        )}
                        {version.comment && (
                          <div className="version-comment">
                            <em>"{version.comment}"</em>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {selectedVersion && (
                <div className="version-details">
                  {/* Tag mode UI */}
                  {tagMode && selectedVersion ? (
                    <div className="tag-version-form">
                      <h4>Tag Version {selectedVersion.versionNumber}</h4>

                      <div className="form-group">
                        <label>Tags (comma separated)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={versionTags.join(', ')}
                          onChange={(e) => setVersionTags(e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
                          placeholder="feature, milestone, important"
                        />
                      </div>

                      <div className="form-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={isSignificant}
                            onChange={(e) => setIsSignificant(e.target.checked)}
                          />
                          Mark as significant version
                        </label>
                      </div>

                      <div className="form-group">
                        <label>Comment</label>
                        <textarea
                          className="form-control"
                          value={versionComment}
                          onChange={(e) => setVersionComment(e.target.value)}
                          placeholder="Add a comment about this version..."
                          rows={3}
                        />
                      </div>

                      <div className="form-actions">
                        <button
                          className="btn btn-secondary"
                          onClick={() => setTagMode(false)}
                          disabled={isLoading}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={handleSaveVersionTags}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Saving...' : 'Save Tags'}
                        </button>
                      </div>
                    </div>
                  ) : comparisonResult ? (
                    /* Comparison results UI */
                    <div className="version-comparison">
                      <h4>Version Comparison</h4>

                      <div className="comparison-header">
                        <div className="comparison-version">
                          <strong>Version {comparisonResult.version1.versionNumber}</strong>
                          <span className="comparison-date">{formatDate(comparisonResult.version1.createdAt)}</span>
                        </div>
                        <div className="comparison-vs">
                          <span className="vs-icon">⟷</span>
                        </div>
                        <div className="comparison-version">
                          <strong>Version {comparisonResult.version2.versionNumber}</strong>
                          <span className="comparison-date">{formatDate(comparisonResult.version2.createdAt)}</span>
                        </div>
                      </div>

                      <div className="comparison-summary">
                        <h5>Summary</h5>
                        <p>{comparisonResult.summary}</p>
                      </div>

                      <div className="comparison-stats">
                        <h5>Change Statistics</h5>
                        <div className="comparison-progress">
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{ width: `${Math.min(100, comparisonResult.comparison.changePercentage)}%` }}
                            ></div>
                          </div>
                          <div className="progress-label">{comparisonResult.comparison.changePercentage}% changed</div>
                        </div>
                        <div className="stats-grid">
                          <div className="stat-item">
                            <span className="stat-label">Lines Added:</span>
                            <span className="stat-value added">{comparisonResult.comparison.addedLines}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Lines Removed:</span>
                            <span className="stat-value removed">{comparisonResult.comparison.removedLines}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Lines Modified:</span>
                            <span className="stat-value modified">{comparisonResult.comparison.modifiedLines}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Words Added:</span>
                            <span className="stat-value added">{comparisonResult.comparison.addedWords}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Words Removed:</span>
                            <span className="stat-value removed">{comparisonResult.comparison.removedWords}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Characters Changed:</span>
                            <span className="stat-value">
                              +{comparisonResult.comparison.addedChars || 0} / -{comparisonResult.comparison.removedChars || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="comparison-actions">
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            setCompareMode(false);
                            setComparisonResult(null);
                            setVersionToCompare(null);
                          }}
                        >
                          Close Comparison
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Normal version details UI */
                    <>
                      <div className="version-details-header">
                        <h4>Version {selectedVersion.versionNumber || selectedVersion.version} Details</h4>
                        {selectedVersion.isSignificant && (
                          <span className="significant-badge-large">Important Version</span>
                        )}
                      </div>

                      <div className="version-meta-card">
                        <div className="version-meta-header">
                          <div className="version-meta-title">
                            <span className="version-date">{formatDate(selectedVersion.createdAt)}</span>
                            <span className="version-age">{getRelativeTimeString(selectedVersion.createdAt)}</span>
                          </div>
                          <div className="version-meta-author">
                            <span className="author-label">By</span>
                            <span className="author-name">
                              {selectedVersion.createdBy?.username ||
                               (selectedVersion.createdBy?.email && selectedVersion.createdBy.email.split('@')[0]) ||
                               'Unknown'}
                            </span>
                          </div>
                        </div>

                        {selectedVersion.description && (
                          <div className="version-description-card">
                            <p>{selectedVersion.description}</p>
                          </div>
                        )}
                      </div>

                      <div className="version-info">
                        <h5>Version Information</h5>

                        {/* Changes section with visual indicators */}
                        {selectedVersion.changes && typeof selectedVersion.changes === 'object' && (
                          <div className="version-changes-card">
                            <h6>Changes</h6>
                            <div className="changes-stats">
                              {selectedVersion.changes.addedChars > 0 && (
                                <div className="change-stat-item">
                                  <span className="change-icon added">+</span>
                                  <span className="change-value">{selectedVersion.changes.addedChars} characters added</span>
                                </div>
                              )}
                              {selectedVersion.changes.removedChars > 0 && (
                                <div className="change-stat-item">
                                  <span className="change-icon removed">-</span>
                                  <span className="change-value">{selectedVersion.changes.removedChars} characters removed</span>
                                </div>
                              )}
                              {selectedVersion.changes.changedLines > 0 && (
                                <div className="change-stat-item">
                                  <span className="change-icon modified">≈</span>
                                  <span className="change-value">{selectedVersion.changes.changedLines} lines modified</span>
                                </div>
                              )}
                            </div>

                            {selectedVersion.metadata && selectedVersion.metadata.changePercentage !== undefined && (
                              <div className="change-percentage">
                                <div className="progress-bar">
                                  <div
                                    className="progress-fill"
                                    style={{ width: `${Math.min(100, selectedVersion.metadata.changePercentage)}%` }}
                                  ></div>
                                </div>
                                <div className="progress-label">{selectedVersion.metadata.changePercentage}% changed from previous version</div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Metadata section */}
                        {selectedVersion.metadata && (
                          <div className="version-metadata">
                            <h6>Additional Information</h6>
                            <ul className="metadata-list">
                              {selectedVersion.metadata.isRestoration && (
                                <li className="metadata-item restoration">
                                  <span className="metadata-icon">↩</span>
                                  <span>Restoration from previous version</span>
                                </li>
                              )}
                              {selectedVersion.metadata.restoredFromVersion && (
                                <li className="metadata-item">
                                  <span>Restored from Version {selectedVersion.metadata.restoredFromVersion}</span>
                                </li>
                              )}
                              {selectedVersion.metadata.contentLength && (
                                <li className="metadata-item">
                                  <span>Document size: {selectedVersion.metadata.contentLength} characters</span>
                                </li>
                              )}
                              {selectedVersion.metadata.lineCount && (
                                <li className="metadata-item">
                                  <span>Line count: {selectedVersion.metadata.lineCount} lines</span>
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>

                      {versionContent && (
                        <div className="version-content-preview">
                          <h5>Content Preview</h5>
                          <div className="content-preview-container">
                            <div className="content-preview">
                              <div dangerouslySetInnerHTML={{
                                __html: versionContent.length > 500
                                  ? versionContent.substring(0, 500) + '...'
                                  : versionContent
                              }} />
                            </div>
                            <div className="content-preview-info">
                              <div className="content-length">
                                <span className="content-length-label">Length:</span>
                                <span className="content-length-value">{versionContent.length} characters</span>
                              </div>
                              <div className="content-lines">
                                <span className="content-lines-label">Lines:</span>
                                <span className="content-lines-value">{versionContent.split('\n').length}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="version-actions">
                        {!selectedVersion.isCurrent && (
                          <button
                            className="btn btn-primary restore-btn"
                            onClick={handleRestoreVersion}
                            disabled={isLoading}
                          >
                            {isLoading ? 'Restoring...' : 'Restore This Version'}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

DocumentHistory.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  documentId: PropTypes.string,
  onRestoreVersion: PropTypes.func.isRequired
};

export default DocumentHistory;

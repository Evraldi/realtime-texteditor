import React from 'react';
import PropTypes from 'prop-types';
import { getRelativeTimeString } from '../../utils/dateUtils';

/**
 * Toolbar component for the text editor
 * Provides formatting options and document information
 */
const Toolbar = ({
  documentTitle,
  lastSaved,
  onSave,
  isSaving,
  unsavedChanges,
  activeUsers,
  connectionStatus
}) => {
  // Format the last saved time
  const lastSavedText = lastSaved ? getRelativeTimeString(lastSaved) : 'Not saved yet';

  // Determine connection status indicator
  const getConnectionStatusIndicator = () => {
    switch (connectionStatus) {
      case 'connected':
        return <span className="status-indicator connected" title="Connected"></span>;
      case 'connecting':
        return <span className="status-indicator connecting" title="Connecting..."></span>;
      case 'disconnected':
        return <span className="status-indicator disconnected" title="Disconnected"></span>;
      default:
        return null;
    }
  };

  return (
    <div className="editor-toolbar">
      <div className="toolbar-left">
        <button
          className="btn btn-primary save-btn"
          onClick={onSave}
          disabled={isSaving || !unsavedChanges}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>

        <div className="document-info">
          <h2 className="document-title">{documentTitle || 'Untitled Document'}</h2>
          <div className="save-status">
            {unsavedChanges && <span className="unsaved-indicator">•</span>}
            <span className="last-saved">Last saved: {lastSavedText}</span>
          </div>
        </div>
      </div>

      <div className="toolbar-right">
        <div className="connection-status">
          {getConnectionStatusIndicator()}
          <span className="status-text">{connectionStatus}</span>
        </div>

        <div className="active-users">
          {activeUsers.map(user => (
            <div
              key={user.id}
              className="user-avatar"
              style={{ backgroundColor: user.color }}
              title={user.name || user.id}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

Toolbar.propTypes = {
  documentTitle: PropTypes.string,
  lastSaved: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  isSaving: PropTypes.bool,
  unsavedChanges: PropTypes.bool,
  activeUsers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      color: PropTypes.string
    })
  ),
  connectionStatus: PropTypes.oneOf(['connected', 'connecting', 'disconnected'])
};

Toolbar.defaultProps = {
  documentTitle: 'Untitled Document',
  isSaving: false,
  unsavedChanges: false,
  activeUsers: [],
  connectionStatus: 'disconnected'
};

export default Toolbar;
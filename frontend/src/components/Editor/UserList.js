import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * UserList component displays a list of active users in the document
 * with their status and activity
 */
const UserList = ({ users, currentUserId }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Sort users: current user first, then alphabetically by name
  const sortedUsers = [...users].sort((a, b) => {
    if (a.id === currentUserId) return -1;
    if (b.id === currentUserId) return 1;
    return (a.name || a.id).localeCompare(b.name || b.id);
  });

  return (
    <div className={`user-list-container ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div 
        className="user-list-toggle" 
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? "Collapse user list" : "Expand user list"}
      >
        <span className="user-count">{users.length}</span>
        <span className="toggle-icon">{isExpanded ? '▼' : '▲'}</span>
      </div>
      
      {isExpanded && (
        <div className="user-list">
          {sortedUsers.map(user => (
            <div key={user.id} className="user-item">
              <div 
                className="user-avatar" 
                style={{ backgroundColor: user.color }}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="user-details">
                <div className="user-name">
                  {user.id === currentUserId ? `${user.name || 'You'} (you)` : (user.name || 'Anonymous')}
                </div>
                <div className="user-status">
                  <span className={`status-dot ${user.status}`}></span>
                  <span className="status-text">{user.status}</span>
                  {user.activity && (
                    <span className="user-activity">{user.activity}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

UserList.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      color: PropTypes.string,
      status: PropTypes.oneOf(['active', 'idle', 'offline']),
      activity: PropTypes.string
    })
  ).isRequired,
  currentUserId: PropTypes.string.isRequired
};

UserList.defaultProps = {
  users: []
};

export default UserList;

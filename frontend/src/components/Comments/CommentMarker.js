import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/comments.css';

/**
 * Component to display a marker in the editor for a comment
 */
const CommentMarker = ({ 
  position, 
  commentCount, 
  isActive, 
  onClick 
}) => {
  const { line, ch } = position;
  
  // Calculate position based on line and character
  const top = line * 20; // Assuming line height is 20px
  const left = ch * 8;   // Assuming character width is 8px
  
  return (
    <div 
      className={`comment-marker ${isActive ? 'active' : ''}`}
      style={{
        top: `${top}px`,
        left: `${left}px`
      }}
      onClick={onClick}
      title={`${commentCount} comment${commentCount !== 1 ? 's' : ''}`}
    >
      <div className="marker-icon">
        <span className="comment-count">{commentCount}</span>
      </div>
    </div>
  );
};

CommentMarker.propTypes = {
  position: PropTypes.shape({
    line: PropTypes.number.isRequired,
    ch: PropTypes.number.isRequired
  }).isRequired,
  commentCount: PropTypes.number.isRequired,
  isActive: PropTypes.bool,
  onClick: PropTypes.func.isRequired
};

CommentMarker.defaultProps = {
  isActive: false
};

export default CommentMarker;

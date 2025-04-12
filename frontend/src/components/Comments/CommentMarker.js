import React from 'react';
import PropTypes from 'prop-types';
import './CommentsVariables.css';
import './CommentMarker.css';

/**
 * CommentMarker - A component to display a marker in the editor for a comment
 *
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.position - Position object with line and ch properties
 * @param {number} props.commentCount - Number of comments at this position
 * @param {boolean} props.isActive - Whether the marker is active
 * @param {Function} props.onClick - Function to call when marker is clicked
 * @returns {JSX.Element} Rendered component
 */
const CommentMarker = ({
  position,
  commentCount,
  isActive,
  onClick
}) => {
  const { line, ch } = position;

  /**
   * Calculate position based on line and character
   * Using CSS variables for better maintainability
   */
  const getStyles = () => {
    // Get computed styles from document to make positioning more accurate
    const lineHeight = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--editor-line-height') || '20', 10);
    const charWidth = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--editor-char-width') || '8', 10);

    const top = line * lineHeight;
    const left = ch * charWidth;

    return { top: `${top}px`, left: `${left}px` };
  };

  // Get plural form for accessibility
  const getCommentText = () => {
    return `${commentCount} comment${commentCount !== 1 ? 's' : ''}`;
  };

  return (
    <div
      className={`comment-marker ${isActive ? 'active' : ''}`}
      style={getStyles()}
      onClick={onClick}
      title={getCommentText()}
      role="button"
      aria-label={`${getCommentText()} at line ${line + 1}, column ${ch + 1}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
          e.preventDefault();
        }
      }}
    >
      <div className="marker-icon">
        <span className="comment-count" aria-hidden="true">{commentCount}</span>
      </div>
      <div className="marker-tooltip">{getCommentText()}</div>
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

// Add CSS variables for editor dimensions if they don't exist
if (!document.getElementById('editor-dimensions-style')) {
  const style = document.createElement('style');
  style.id = 'editor-dimensions-style';
  style.innerHTML = `
    :root {
      --editor-line-height: 20px;
      --editor-char-width: 8px;
    }
  `;
  document.head.appendChild(style);
}

export default CommentMarker;

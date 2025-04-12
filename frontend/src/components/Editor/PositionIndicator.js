import React from 'react';
import PropTypes from 'prop-types';

/**
 * PositionIndicator component displays the current cursor position
 * and other editor metadata
 */
const PositionIndicator = ({ line, column, selectionLength, wordCount, charCount }) => {
  return (
    <div className="position-indicator">
      <div className="cursor-position">
        Line: {line}, Column: {column}
        {selectionLength > 0 && <span className="selection-info"> | {selectionLength} selected</span>}
      </div>
      <div className="document-stats">
        {wordCount} words | {charCount} characters
      </div>
    </div>
  );
};

PositionIndicator.propTypes = {
  line: PropTypes.number.isRequired,
  column: PropTypes.number.isRequired,
  selectionLength: PropTypes.number,
  wordCount: PropTypes.number,
  charCount: PropTypes.number
};

PositionIndicator.defaultProps = {
  selectionLength: 0,
  wordCount: 0,
  charCount: 0
};

export default PositionIndicator;

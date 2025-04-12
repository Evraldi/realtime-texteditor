/**
 * Utility functions for text formatting
 */

/**
 * Calculate the difference between two positions in a document
 * @param {Object} pos1 - First position {line, ch}
 * @param {Object} pos2 - Second position {line, ch}
 * @returns {number} - Number of characters between positions
 */
const calculatePositionDifference = (pos1, pos2) => {
  if (pos1.line === pos2.line) {
    return Math.abs(pos2.ch - pos1.ch);
  }
  
  // For multi-line differences, we need to estimate
  // This is a simplified calculation
  const lineDiff = Math.abs(pos2.line - pos1.line);
  const avgLineLength = 80; // Assume average line length
  
  return (lineDiff * avgLineLength) + Math.abs(pos2.ch - pos1.ch);
};

/**
 * Adjust format positions after content changes
 * @param {Array} formats - Array of format objects
 * @param {Object} changePos - Position where change occurred {line, ch}
 * @param {number} charsAdded - Number of characters added (negative for deletion)
 * @param {number} linesAdded - Number of lines added (negative for deletion)
 * @returns {Array} - Updated formats array
 */
const adjustFormatPositions = (formats, changePos, charsAdded, linesAdded) => {
  return formats.map(format => {
    const newFormat = { ...format };
    
    // Check if change is before start position
    const isBeforeStart = 
      (changePos.line < format.startPos.line) || 
      (changePos.line === format.startPos.line && changePos.ch <= format.startPos.ch);
    
    // Check if change is before end position
    const isBeforeEnd = 
      (changePos.line < format.endPos.line) || 
      (changePos.line === format.endPos.line && changePos.ch <= format.endPos.ch);
    
    // Adjust start position if change is before it
    if (isBeforeStart) {
      if (changePos.line === format.startPos.line) {
        // Same line, adjust character position
        newFormat.startPos = {
          line: format.startPos.line,
          ch: format.startPos.ch + charsAdded
        };
      } else {
        // Different line, adjust line position
        newFormat.startPos = {
          line: format.startPos.line + linesAdded,
          ch: format.startPos.ch
        };
      }
    }
    
    // Adjust end position if change is before it
    if (isBeforeEnd) {
      if (changePos.line === format.endPos.line) {
        // Same line, adjust character position
        newFormat.endPos = {
          line: format.endPos.line,
          ch: format.endPos.ch + charsAdded
        };
      } else {
        // Different line, adjust line position
        newFormat.endPos = {
          line: format.endPos.line + linesAdded,
          ch: format.endPos.ch
        };
      }
    }
    
    return newFormat;
  });
};

/**
 * Check if a position is within a format range
 * @param {Object} pos - Position to check {line, ch}
 * @param {Object} format - Format object with startPos and endPos
 * @returns {boolean} - True if position is within format range
 */
const isPositionInFormat = (pos, format) => {
  const { startPos, endPos } = format;
  
  // Check if position is after start
  const isAfterStart = 
    (pos.line > startPos.line) || 
    (pos.line === startPos.line && pos.ch >= startPos.ch);
  
  // Check if position is before end
  const isBeforeEnd = 
    (pos.line < endPos.line) || 
    (pos.line === endPos.line && pos.ch <= endPos.ch);
  
  return isAfterStart && isBeforeEnd;
};

/**
 * Get all formats that apply to a position
 * @param {Object} pos - Position to check {line, ch}
 * @param {Array} formats - Array of format objects
 * @returns {Array} - Array of formats that apply to the position
 */
const getFormatsAtPosition = (pos, formats) => {
  return formats.filter(format => isPositionInFormat(pos, format));
};

module.exports = {
  calculatePositionDifference,
  adjustFormatPositions,
  isPositionInFormat,
  getFormatsAtPosition
};

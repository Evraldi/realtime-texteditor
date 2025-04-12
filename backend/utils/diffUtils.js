/**
 * Utility functions for calculating differences between document versions
 */

/**
 * Calculate changes between two document contents using a more sophisticated algorithm
 * @param {string} oldContent - Previous document content
 * @param {string} newContent - New document content
 * @returns {Object} Change statistics and metadata
 */
exports.calculateChanges = (oldContent, newContent) => {
  // Ensure inputs are strings
  const oldText = typeof oldContent === 'string' ? oldContent : '';
  const newText = typeof newContent === 'string' ? newContent : '';
  
  // Basic character-level statistics
  const oldLength = oldText.length;
  const newLength = newText.length;
  
  // Split into lines for line-level analysis
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  
  // Calculate line changes
  const { addedLines, removedLines, modifiedLines } = calculateLineChanges(oldLines, newLines);
  
  // Calculate word changes
  const { addedWords, removedWords, modifiedWords } = calculateWordChanges(oldText, newText);
  
  // Calculate character changes
  const addedChars = Math.max(0, newLength - oldLength);
  const removedChars = Math.max(0, oldLength - newLength);
  
  // Calculate change percentage
  const totalChars = Math.max(oldLength, newLength);
  const changePercentage = totalChars === 0 ? 0 : 
    Math.round(((addedChars + removedChars) / totalChars) * 100);
  
  return {
    // Character-level changes
    addedChars,
    removedChars,
    
    // Line-level changes
    addedLines,
    removedLines,
    modifiedLines,
    totalChangedLines: addedLines + removedLines + modifiedLines,
    
    // Word-level changes
    addedWords,
    removedWords,
    modifiedWords,
    
    // Overall statistics
    changePercentage,
    
    // Metadata
    oldLength,
    newLength,
    oldLineCount: oldLines.length,
    newLineCount: newLines.length
  };
};

/**
 * Calculate line-level changes between two texts
 * @param {Array<string>} oldLines - Array of lines from old content
 * @param {Array<string>} newLines - Array of lines from new content
 * @returns {Object} Line change statistics
 */
function calculateLineChanges(oldLines, newLines) {
  let addedLines = 0;
  let removedLines = 0;
  let modifiedLines = 0;
  
  // Simple line-by-line comparison
  const minLines = Math.min(oldLines.length, newLines.length);
  
  // Count modified lines
  for (let i = 0; i < minLines; i++) {
    if (oldLines[i] !== newLines[i]) {
      modifiedLines++;
    }
  }
  
  // Count added/removed lines
  if (oldLines.length > newLines.length) {
    removedLines = oldLines.length - newLines.length;
  } else if (newLines.length > oldLines.length) {
    addedLines = newLines.length - oldLines.length;
  }
  
  return { addedLines, removedLines, modifiedLines };
}

/**
 * Calculate word-level changes between two texts
 * @param {string} oldText - Old content
 * @param {string} newText - New content
 * @returns {Object} Word change statistics
 */
function calculateWordChanges(oldText, newText) {
  // Split into words
  const oldWords = oldText.split(/\s+/).filter(word => word.length > 0);
  const newWords = newText.split(/\s+/).filter(word => word.length > 0);
  
  // Count words
  const oldWordCount = oldWords.length;
  const newWordCount = newWords.length;
  
  // Calculate added/removed words
  const addedWords = Math.max(0, newWordCount - oldWordCount);
  const removedWords = Math.max(0, oldWordCount - newWordCount);
  
  // Estimate modified words (simplified approach)
  // In a real implementation, you would use a more sophisticated diff algorithm
  const minWords = Math.min(oldWordCount, newWordCount);
  let modifiedWords = 0;
  
  for (let i = 0; i < minWords; i++) {
    if (oldWords[i] !== newWords[i]) {
      modifiedWords++;
    }
  }
  
  return { addedWords, removedWords, modifiedWords };
}

/**
 * Generate a human-readable description of changes
 * @param {Object} changes - Change statistics object
 * @returns {string} Human-readable description
 */
exports.generateChangeDescription = (changes) => {
  const parts = [];
  
  // Add significant changes to the description
  if (changes.addedLines > 0) {
    parts.push(`${changes.addedLines} line${changes.addedLines !== 1 ? 's' : ''} added`);
  }
  
  if (changes.removedLines > 0) {
    parts.push(`${changes.removedLines} line${changes.removedLines !== 1 ? 's' : ''} removed`);
  }
  
  if (changes.modifiedLines > 0) {
    parts.push(`${changes.modifiedLines} line${changes.modifiedLines !== 1 ? 's' : ''} modified`);
  }
  
  if (changes.addedWords > 0) {
    parts.push(`${changes.addedWords} word${changes.addedWords !== 1 ? 's' : ''} added`);
  }
  
  if (changes.removedWords > 0) {
    parts.push(`${changes.removedWords} word${changes.removedWords !== 1 ? 's' : ''} removed`);
  }
  
  // If no significant changes detected
  if (parts.length === 0) {
    if (changes.addedChars > 0 || changes.removedChars > 0) {
      parts.push(`Minor text changes (${changes.changePercentage}% changed)`);
    } else {
      parts.push('No significant changes');
    }
  }
  
  return parts.join(', ');
};

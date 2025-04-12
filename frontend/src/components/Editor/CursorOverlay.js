import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Converts a hex color to rgba format with specified opacity
 * @param {string} hexColor - Hex color code (e.g., '#FF0000')
 * @param {number} opacity - Opacity value between 0 and 1
 * @returns {string} RGBA color string
 */
const hexToRgba = (hexColor, opacity = 1) => {
  const defaultColor = `rgba(74, 111, 165, ${opacity})`;

  // Validate input
  if (!hexColor || typeof hexColor !== 'string' || !hexColor.startsWith('#')) {
    return defaultColor;
  }

  try {
    const hex = hexColor.replace('#', '');
    let r, g, b;

    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else {
      return defaultColor;
    }

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  } catch (error) {
    return defaultColor;
  }
};

/**
 * Component to render remote cursors and selections in the editor
 * Follows best practices from popular collaborative editors
 */
const CursorOverlay = ({ cursors, editorRef }) => {
  // Cache for character measurements to improve performance
  const charMeasureCache = useRef(new Map());
  const [editorDimensions, setEditorDimensions] = useState({
    lineHeight: 20,
    charWidth: 8,
    paddingTop: 0,
    paddingLeft: 0
  });

  // Get editor dimensions on mount and when editor changes
  useEffect(() => {
    if (!editorRef || !editorRef.current) return;

    const updateEditorDimensions = () => {
      try {
        const quill = editorRef.current.getEditor();
        const editorElement = quill.container.querySelector('.ql-editor');
        const computedStyle = window.getComputedStyle(editorElement);

        // Get dimensions for positioning
        const lineHeight = parseFloat(computedStyle.lineHeight) || 20;
        const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
        const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;

        // Measure character width using canvas for accuracy
        const fontString = `${computedStyle.fontWeight} ${computedStyle.fontSize} ${computedStyle.fontFamily}`;
        let charWidth;

        if (charMeasureCache.current.has(fontString)) {
          charWidth = charMeasureCache.current.get(fontString);
        } else {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          context.font = fontString;
          // Measure multiple characters for better average
          const text = 'XXXXXXXXXX';
          const width = context.measureText(text).width;
          charWidth = width / text.length;
          
          // Cache the result
          charMeasureCache.current.set(fontString, charWidth);
        }

        setEditorDimensions({
          lineHeight,
          charWidth,
          paddingTop,
          paddingLeft
        });
      } catch (error) {
        console.error('Error measuring editor dimensions:', error);
      }
    };

    // Initial measurement
    updateEditorDimensions();

    // Re-measure on window resize
    window.addEventListener('resize', updateEditorDimensions);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', updateEditorDimensions);
    };
  }, [editorRef]);

  // If no editor or cursors, don't render anything
  if (!cursors || !editorRef || !editorRef.current) return null;

  const { lineHeight, charWidth, paddingTop, paddingLeft } = editorDimensions;

  return (
    <div className="cursor-overlay">
      {cursors.map((cursor) => {
        if (!cursor || !cursor.position) return null;

        const { userId, username, position, color: cursorColor } = cursor;
        const { line, ch } = position;

        // Calculate cursor position
        const top = (line * lineHeight) + paddingTop;
        const left = (ch * charWidth) + paddingLeft;

        // Render cursor and selection
        return (
          <React.Fragment key={userId}>
            {/* Render selection if available */}
            {cursor.selection && (
              <CursorSelection
                selection={cursor.selection}
                color={cursorColor}
                lineHeight={lineHeight}
                charWidth={charWidth}
                paddingTop={paddingTop}
                paddingLeft={paddingLeft}
              />
            )}
            
            {/* Render cursor */}
            <div
              className="remote-cursor"
              style={{
                top: `${top}px`,
                left: `${left}px`,
                backgroundColor: cursorColor || '#4a6fa5',
                height: `${lineHeight}px`,
                width: '2px', // Thin cursor like in VS Code
                position: 'absolute',
                zIndex: 10,
                animation: 'cursor-blink 1s infinite',
                willChange: 'transform', // Performance optimization
                transform: 'translateZ(0)', // Force GPU acceleration
              }}
            >
              {/* Cursor flag with username */}
              <div
                className="remote-cursor-flag"
                style={{
                  backgroundColor: cursorColor || '#4a6fa5',
                  color: '#fff',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '12px',
                  position: 'absolute',
                  top: '-20px',
                  left: '0',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                  zIndex: 11,
                }}
              >
                {username || 'User'}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/**
 * Component to render text selection for a remote user
 */
const CursorSelection = ({ selection, color, lineHeight, charWidth, paddingTop, paddingLeft }) => {
  if (!selection || !selection.start || !selection.end) return null;

  const { start, end } = selection;
  
  // Common style for all selection elements
  const commonStyle = {
    backgroundColor: hexToRgba(color, 0.2),
    border: `1px solid ${hexToRgba(color, 0.5)}`,
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: 5,
  };

  // Single-line selection
  if (start.line === end.line) {
    const top = (start.line * lineHeight) + paddingTop;
    const left = (start.ch * charWidth) + paddingLeft;
    const width = ((end.ch - start.ch) * charWidth) || 2; // Minimum width of 2px

    return (
      <div
        className="remote-selection"
        style={{
          ...commonStyle,
          top: `${top}px`,
          left: `${left}px`,
          height: `${lineHeight}px`,
          width: `${width}px`,
        }}
      />
    );
  }

  // Multi-line selection
  const elements = [];

  // First line
  const firstLineTop = (start.line * lineHeight) + paddingTop;
  const firstLineLeft = (start.ch * charWidth) + paddingLeft;
  const firstLineWidth = `calc(100% - ${firstLineLeft}px)`;

  elements.push(
    <div
      key={`selection-first-${start.line}`}
      className="remote-selection"
      style={{
        ...commonStyle,
        top: `${firstLineTop}px`,
        left: `${firstLineLeft}px`,
        height: `${lineHeight}px`,
        width: firstLineWidth,
      }}
    />
  );

  // Middle lines
  for (let line = start.line + 1; line < end.line; line++) {
    const middleLineTop = (line * lineHeight) + paddingTop;
    
    elements.push(
      <div
        key={`selection-middle-${line}`}
        className="remote-selection"
        style={{
          ...commonStyle,
          top: `${middleLineTop}px`,
          left: `${paddingLeft}px`,
          height: `${lineHeight}px`,
          width: `calc(100% - ${paddingLeft}px)`,
        }}
      />
    );
  }

  // Last line
  const lastLineTop = (end.line * lineHeight) + paddingTop;
  const lastLineWidth = (end.ch * charWidth);

  elements.push(
    <div
      key={`selection-last-${end.line}`}
      className="remote-selection"
      style={{
        ...commonStyle,
        top: `${lastLineTop}px`,
        left: `${paddingLeft}px`,
        height: `${lineHeight}px`,
        width: `${lastLineWidth}px`,
      }}
    />
  );

  return elements;
};

CursorOverlay.propTypes = {
  cursors: PropTypes.arrayOf(
    PropTypes.shape({
      userId: PropTypes.string.isRequired,
      username: PropTypes.string,
      position: PropTypes.shape({
        line: PropTypes.number.isRequired,
        ch: PropTypes.number.isRequired,
      }),
      selection: PropTypes.shape({
        start: PropTypes.shape({
          line: PropTypes.number.isRequired,
          ch: PropTypes.number.isRequired,
        }),
        end: PropTypes.shape({
          line: PropTypes.number.isRequired,
          ch: PropTypes.number.isRequired,
        }),
      }),
      color: PropTypes.string,
    })
  ).isRequired,
  editorRef: PropTypes.object.isRequired,
};

CursorSelection.propTypes = {
  selection: PropTypes.shape({
    start: PropTypes.shape({
      line: PropTypes.number.isRequired,
      ch: PropTypes.number.isRequired,
    }),
    end: PropTypes.shape({
      line: PropTypes.number.isRequired,
      ch: PropTypes.number.isRequired,
    }),
  }),
  color: PropTypes.string,
  lineHeight: PropTypes.number.isRequired,
  charWidth: PropTypes.number.isRequired,
  paddingTop: PropTypes.number.isRequired,
  paddingLeft: PropTypes.number.isRequired,
};

export default CursorOverlay;

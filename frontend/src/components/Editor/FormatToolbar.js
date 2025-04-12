import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './FormatToolbar.css';

/**
 * FormatToolbar component provides text formatting options
 */
const FormatToolbar = ({ onFormat }) => {
  // State for color pickers
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);

  // Refs for dropdown containers
  const textColorRef = useRef(null);
  const bgColorRef = useRef(null);
  const fontPickerRef = useRef(null);
  const sizePickerRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close text color picker if clicking outside
      if (textColorRef.current && !textColorRef.current.contains(event.target)) {
        setShowTextColorPicker(false);
      }

      // Close background color picker if clicking outside
      if (bgColorRef.current && !bgColorRef.current.contains(event.target)) {
        setShowBgColorPicker(false);
      }

      // Close font picker if clicking outside
      if (fontPickerRef.current && !fontPickerRef.current.contains(event.target)) {
        setShowFontPicker(false);
      }

      // Close size picker if clicking outside
      if (sizePickerRef.current && !sizePickerRef.current.contains(event.target)) {
        setShowSizePicker(false);
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Available colors
  const colors = [
    '#000000', '#e60000', '#ff9900', '#ffff00', '#008a00',
    '#0066cc', '#9933ff', '#ffffff', '#facccc', '#ffebcc',
    '#ffffcc', '#cce8cc', '#cce0f5', '#ebd6ff', '#bbbbbb',
    '#f06666', '#ffc266', '#ffff66', '#66b966', '#66a3e0',
    '#c285ff', '#888888', '#a10000', '#b26b00', '#b2b200',
    '#006100', '#0047b2', '#6b24b2', '#444444', '#5c0000',
    '#663d00', '#666600', '#003700', '#002966', '#3d1466'
  ];

  // Available fonts
  const fonts = [
    'sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'system-ui'
  ];

  // Available sizes
  const sizes = [
    'small', 'normal', 'large', 'huge'
  ];

  const handleFormat = (formatType, value) => {
    if (onFormat) {
      onFormat(formatType, value);
    }

    // Close any open dropdowns
    setShowTextColorPicker(false);
    setShowBgColorPicker(false);
    setShowFontPicker(false);
    setShowSizePicker(false);
  };

  return (
    <div className="format-toolbar">
      {/* Text formatting */}
      <div className="format-group">
        <button
          className="format-btn"
          onClick={() => handleFormat('bold')}
          title="Bold (Ctrl+B)"
        >
          <i className="format-icon bold-icon">B</i>
        </button>

        <button
          className="format-btn"
          onClick={() => handleFormat('italic')}
          title="Italic (Ctrl+I)"
        >
          <i className="format-icon italic-icon">I</i>
        </button>

        <button
          className="format-btn"
          onClick={() => handleFormat('underline')}
          title="Underline (Ctrl+U)"
        >
          <i className="format-icon underline-icon">U</i>
        </button>

        <button
          className="format-btn"
          onClick={() => handleFormat('strike')}
          title="Strikethrough"
        >
          <i className="format-icon strike-icon">S</i>
        </button>
      </div>

      {/* Headings */}
      <div className="format-group">
        <button
          className="format-btn"
          onClick={() => handleFormat('header', 1)}
          title="Heading 1"
        >
          <i className="format-icon">H1</i>
        </button>

        <button
          className="format-btn"
          onClick={() => handleFormat('header', 2)}
          title="Heading 2"
        >
          <i className="format-icon">H2</i>
        </button>

        <button
          className="format-btn"
          onClick={() => handleFormat('header', 3)}
          title="Heading 3"
        >
          <i className="format-icon">H3</i>
        </button>

        <button
          className="format-btn"
          onClick={() => handleFormat('header', false)}
          title="Normal Text"
        >
          <i className="format-icon">T</i>
        </button>
      </div>

      {/* Lists */}
      <div className="format-group">
        <button
          className="format-btn"
          onClick={() => handleFormat('list', 'bullet')}
          title="Bullet List"
        >
          <i className="format-icon">•</i>
        </button>

        <button
          className="format-btn"
          onClick={() => handleFormat('list', 'ordered')}
          title="Number List"
        >
          <i className="format-icon">#</i>
        </button>

        <button
          className="format-btn"
          onClick={() => handleFormat('indent', '+1')}
          title="Increase Indent"
        >
          <i className="format-icon">→</i>
        </button>

        <button
          className="format-btn"
          onClick={() => handleFormat('indent', '-1')}
          title="Decrease Indent"
        >
          <i className="format-icon">←</i>
        </button>
      </div>

      {/* Alignment */}
      <div className="format-group">
        <button
          className="format-btn"
          onClick={() => handleFormat('align', '')}
          title="Align Left"
        >
          <i className="format-icon">⫷</i>
        </button>

        <button
          className="format-btn"
          onClick={() => handleFormat('align', 'center')}
          title="Align Center"
        >
          <i className="format-icon">≡</i>
        </button>

        <button
          className="format-btn"
          onClick={() => handleFormat('align', 'right')}
          title="Align Right"
        >
          <i className="format-icon">⫸</i>
        </button>

        <button
          className="format-btn"
          onClick={() => handleFormat('align', 'justify')}
          title="Justify"
        >
          <i className="format-icon">≣</i>
        </button>
      </div>

      {/* Rich content */}
      <div className="format-group">
        <button
          className="format-btn"
          onClick={() => handleFormat('link')}
          title="Insert Link"
        >
          <i className="format-icon">🔗</i>
        </button>

        <button
          className="format-btn"
          onClick={() => handleFormat('image')}
          title="Insert Image"
        >
          <i className="format-icon">�️</i>
        </button>

        <button
          className="format-btn"
          onClick={() => handleFormat('code-block')}
          title="Code Block"
        >
          <i className="format-icon">{ }</i>
        </button>

        <button
          className="format-btn"
          onClick={() => handleFormat('blockquote')}
          title="Blockquote"
        >
          <i className="format-icon">"</i>
        </button>
      </div>

      {/* Script */}
      <div className="format-group">
        <button
          className="format-btn"
          onClick={() => handleFormat('script', 'super')}
          title="Superscript"
        >
          <i className="format-icon">x²</i>
        </button>

        <button
          className="format-btn"
          onClick={() => handleFormat('script', 'sub')}
          title="Subscript"
        >
          <i className="format-icon">x₂</i>
        </button>
      </div>

      {/* Font family */}
      <div className="format-group">
        <div className="dropdown-container" ref={fontPickerRef}>
          <button
            className="format-btn"
            onClick={() => setShowFontPicker(!showFontPicker)}
            title="Font Family"
          >
            <i className="format-icon">Font</i>
          </button>
          {showFontPicker && (
            <div className="dropdown-menu">
              {fonts.map((font, index) => (
                <button
                  key={index}
                  className="dropdown-item"
                  style={{ fontFamily: font }}
                  onClick={() => handleFormat('font', font)}
                >
                  {font}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Font size */}
      <div className="format-group">
        <div className="dropdown-container" ref={sizePickerRef}>
          <button
            className="format-btn"
            onClick={() => setShowSizePicker(!showSizePicker)}
            title="Font Size"
          >
            <i className="format-icon">Size</i>
          </button>
          {showSizePicker && (
            <div className="dropdown-menu">
              {sizes.map((size, index) => (
                <button
                  key={index}
                  className="dropdown-item"
                  onClick={() => handleFormat('size', size)}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Text color */}
      <div className="format-group">
        <div className="dropdown-container" ref={textColorRef}>
          <button
            className="format-btn"
            onClick={() => setShowTextColorPicker(!showTextColorPicker)}
            title="Text Color"
          >
            <i className="format-icon" style={{ color: '#F00' }}>A</i>
          </button>
          {showTextColorPicker && (
            <div className="color-dropdown">
              {colors.map((color, index) => (
                <div
                  key={index}
                  className="color-option"
                  style={{ backgroundColor: color }}
                  onClick={() => handleFormat('color', color)}
                  title={color}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Background color */}
      <div className="format-group">
        <div className="dropdown-container" ref={bgColorRef}>
          <button
            className="format-btn"
            onClick={() => setShowBgColorPicker(!showBgColorPicker)}
            title="Background Color"
          >
            <i className="format-icon" style={{ backgroundColor: '#FF0', padding: '0 3px' }}>A</i>
          </button>
          {showBgColorPicker && (
            <div className="color-dropdown">
              {colors.map((color, index) => (
                <div
                  key={index}
                  className="color-option"
                  style={{ backgroundColor: color }}
                  onClick={() => handleFormat('background', color)}
                  title={color}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Clear formatting */}
      <div className="format-group">
        <button
          className="format-btn"
          onClick={() => handleFormat('removeFormat')}
          title="Clear Formatting"
        >
          <i className="format-icon">Aa</i>
        </button>
      </div>
    </div>
  );
};

FormatToolbar.propTypes = {
  onFormat: PropTypes.func.isRequired
};

export default FormatToolbar;

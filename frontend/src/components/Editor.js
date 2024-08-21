import React, { useState, useEffect } from 'react';
import socket from '../utils/socket';
import '../styles/Editor.css';

function Editor() {
  const [text, setText] = useState('');

  useEffect(() => {
    socket.on('text update', (newText) => {
      setText(newText);
    });

    return () => {
      socket.off('text update');
    };
  }, []);

  const handleChange = (event) => {
    setText(event.target.value);
    socket.emit('text update', event.target.value);
  };

  return (
    <div className="editor">
      <textarea
        value={text}
        onChange={handleChange}
        placeholder="Start typing..."
      />
    </div>
  );
}

export default Editor;

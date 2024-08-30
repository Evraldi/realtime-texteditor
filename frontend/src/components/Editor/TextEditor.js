import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { getDocument, saveDocument } from '../../services/documentService';

// Initialize socket with a configurable URL
const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');

const TextEditor = () => {
  const { docId } = useParams();
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!docId) {
      console.error('Document ID is undefined');
      return;
    }

    const fetchDocument = async () => {
      try {
        const doc = await getDocument(docId);
        if (doc) {
          setContent(doc.content);
        }
      } catch (error) {
        console.error('Error fetching document:', error);
      }
    };
    
    fetchDocument();

    // Join the document room on the socket
    socket.emit('joinDocument', docId);

    // Set up socket event listeners
    const handleDocumentUpdate = (updatedDoc) => {
      setContent(updatedDoc.content);
    };
    socket.on('documentUpdated', handleDocumentUpdate);

    // Cleanup function to remove socket event listeners
    return () => {
      socket.off('documentUpdated', handleDocumentUpdate);
    };
  }, [docId]);

  const handleChange = (e) => {
    setContent(e.target.value);
    if (docId) {
      socket.emit('updateDocument', { _id: docId, content: e.target.value });
    }
  };

  const handleSave = async () => {
    if (docId) {
      try {
        await saveDocument(docId, content);
      } catch (error) {
        console.error('Error saving document:', error);
      }
    } else {
      console.error('Document ID is undefined');
    }
  };

  return (
    <div>
      <textarea value={content} onChange={handleChange} />
      <button onClick={handleSave}>Save</button>
    </div>
  );
};

export default TextEditor;

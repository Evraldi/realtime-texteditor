import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDocuments } from '../../services/documentService';

const DocumentList = () => {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const fetchDocuments = async () => {
      const docs = await getDocuments();
      setDocuments(docs);
    };
    
    fetchDocuments();
  }, []);

  return (
    <div>
      <h2>Your Documents</h2>
      <ul>
        {documents.map((doc) => (
          <li key={doc._id}>
            <Link to={`/editor/${doc._id}`}>{doc._id}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DocumentList;

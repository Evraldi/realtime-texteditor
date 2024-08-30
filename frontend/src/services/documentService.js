export const getDocuments = async () => {
    const response = await fetch(`http://localhost:5000/api/documents`);
    if (!response.ok) throw new Error('Failed to fetch documents');
    return response.json();
  };
  
  export const getDocument = async (id) => {
    const response = await fetch(`http://localhost:5000/api/document/${id}`);
    if (!response.ok) throw new Error('Failed to fetch document');
    return response.json();
  };
  
  export const saveDocument = async (id, content) => {
    const response = await fetch(`http://localhost:5000/api/document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, content }),
    });
    if (!response.ok) throw new Error('Failed to save document');
  };
  
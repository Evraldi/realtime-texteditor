const mongoose = require('mongoose');
const Document = require('../models/Document');

exports.getDocumentById = async (req, res) => {
  const { id } = req.params;

  console.log(`Received ID for fetch: ${id}`); // Add this line for debugging

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: `Invalid document ID: ${id}` });
  }

  try {
    const document = await Document.findById(id);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error); // More detailed logging
    res.status(500).json({ message: error.message });
  }
};

exports.saveDocument = async (req, res) => {
  const { id, content } = req.body;

  console.log(`Received ID for save: ${id}`); // Add this line for debugging

  if (id && !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: `Invalid document ID: ${id}` });
  }

  try {
    let document;
    if (id) {
      document = await Document.findById(id);
      if (document) {
        // Update existing document
        document.content = content;
        document.versions.push({ content });
        await document.save();
      } else {
        return res.status(404).json({ message: 'Document not found' });
      }
    } else {
      // Create new document
      document = new Document({ content });
      await document.save();
    }

    res.status(200).json(document);
  } catch (error) {
    console.error('Error saving document:', error); // More detailed logging
    res.status(500).json({ message: error.message });
  }
};

exports.getDocuments = async (req, res) => {
  try {
    const documents = await Document.find();
    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error); // More detailed logging
    res.status(500).json({ message: error.message });
  }
};

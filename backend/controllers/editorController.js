const Document = require('../models/documentModel');

// Get document by ID
exports.getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create or update document
exports.saveDocument = async (req, res) => {
  try {
    const { id, content } = req.body;
    let document = await Document.findById(id);

    if (document) {
      // Update document
      document.content = content;
      await document.save();
    } else {
      // Create new document
      document = new Document({ _id: id, content });
      await document.save();
    }

    res.status(200).json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

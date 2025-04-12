# Text Format API Documentation

This document describes the API endpoints for managing text formatting in the real-time text editor.

## Models

### TextFormat

The `TextFormat` model stores formatting information for document content:

```javascript
{
  document: ObjectId,        // Reference to the document
  formats: [                 // Array of format ranges
    {
      startPos: {            // Start position of the format
        line: Number,
        ch: Number
      },
      endPos: {              // End position of the format
        line: Number,
        ch: Number
      },
      formatType: String,    // Type of format (bold, italic, etc.)
      formatData: Mixed,     // Additional data for certain format types
      appliedBy: ObjectId,   // User who applied the format
      appliedAt: Date        // When the format was applied
    }
  ],
  documentVersion: Number,   // Version of the document this format applies to
  lastUpdated: Date          // Last updated timestamp
}
```

## API Endpoints

### Get Formats

Retrieves all formats for a document.

- **URL**: `/api/formats/document/:documentId`
- **Method**: `GET`
- **Authentication**: Required
- **URL Parameters**: 
  - `documentId`: ID of the document

#### Success Response

- **Code**: 200
- **Content**:
```json
{
  "_id": "format_id",
  "document": "document_id",
  "formats": [
    {
      "startPos": { "line": 0, "ch": 0 },
      "endPos": { "line": 0, "ch": 5 },
      "formatType": "bold",
      "formatData": null,
      "appliedBy": {
        "_id": "user_id",
        "username": "username",
        "email": "user@example.com"
      },
      "appliedAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "documentVersion": 1,
  "lastUpdated": "2023-01-01T00:00:00.000Z"
}
```

### Apply Format

Applies a format to a range of text in a document.

- **URL**: `/api/formats/document/:documentId`
- **Method**: `POST`
- **Authentication**: Required
- **URL Parameters**: 
  - `documentId`: ID of the document
- **Request Body**:
```json
{
  "formatType": "bold",
  "startPos": { "line": 0, "ch": 0 },
  "endPos": { "line": 0, "ch": 5 },
  "formatData": null
}
```

#### Success Response

- **Code**: 200
- **Content**: The updated TextFormat object

### Remove Format

Removes a specific format from a document.

- **URL**: `/api/formats/document/:documentId/format/:formatId`
- **Method**: `DELETE`
- **Authentication**: Required
- **URL Parameters**: 
  - `documentId`: ID of the document
  - `formatId`: ID of the format to remove

#### Success Response

- **Code**: 200
- **Content**:
```json
{
  "message": "Format removed successfully"
}
```

### Clear Formats

Removes all formats from a document.

- **URL**: `/api/formats/document/:documentId`
- **Method**: `DELETE`
- **Authentication**: Required
- **URL Parameters**: 
  - `documentId`: ID of the document

#### Success Response

- **Code**: 200
- **Content**:
```json
{
  "message": "All formats cleared successfully"
}
```

## Socket.IO Events

### applyFormat

Emitted when a user applies a format to text.

- **Client Emits**:
```javascript
socket.emit('applyFormat', {
  docId: 'document_id',
  format: {
    formatType: 'bold',
    startPos: { line: 0, ch: 0 },
    endPos: { line: 0, ch: 5 },
    formatData: null
  }
});
```

- **Server Broadcasts**:
```javascript
socket.to(docId).emit('formatApplied', {
  docId: 'document_id',
  format: {
    formatType: 'bold',
    startPos: { line: 0, ch: 0 },
    endPos: { line: 0, ch: 5 },
    formatData: null
  }
});
```

### removeFormat

Emitted when a user removes a format.

- **Client Emits**:
```javascript
socket.emit('removeFormat', {
  docId: 'document_id',
  formatId: 'format_id'
});
```

- **Server Broadcasts**:
```javascript
socket.to(docId).emit('formatRemoved', {
  docId: 'document_id',
  formatId: 'format_id'
});
```

### clearFormats

Emitted when a user clears all formats.

- **Client Emits**:
```javascript
socket.emit('clearFormats', {
  docId: 'document_id'
});
```

- **Server Broadcasts**:
```javascript
socket.to(docId).emit('formatsCleared', {
  docId: 'document_id'
});
```

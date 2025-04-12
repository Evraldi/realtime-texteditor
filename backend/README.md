# Real-Time Text Editor Backend

This is the backend server for the Real-Time Text Editor application.

## Features

- RESTful API for document management
- Real-time collaboration using Socket.IO
- User authentication with JWT
- MongoDB database integration

## Getting Started

### Prerequisites

- Node.js (v16.20.1 or higher)
- MongoDB (local or remote)

### Installation

1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies:

```bash
npm install
```

4. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

5. Update the `.env` file with your configuration

### Running the Server

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token

### Documents

- `GET /api/documents` - Get all documents
- `GET /api/document/:id` - Get a specific document
- `POST /api/document` - Create or update a document

## WebSocket Events

- `joinDocument` - Join a document room
- `updateDocument` - Update document content
- `documentUpdated` - Receive document updates

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| MONGO_URI | MongoDB connection string | Required |
| JWT_SECRET | Secret for JWT signing | Required |
| PORT | Server port | 5000 |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:3000 |
| NODE_ENV | Environment (development/production) | development |

## Project Structure

```
backend/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── models/         # Database models
├── routes/         # API routes
├── .env            # Environment variables
├── .env.example    # Example environment file
├── server.js       # Entry point
└── package.json    # Dependencies
```

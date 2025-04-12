const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const setupSocket = require('./config/socket');
const validateEnv = require('./config/validateEnv');

// Import routes
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const commentRoutes = require('./routes/commentRoutes');
const versionRoutes = require('./routes/versionRoutes');
const formatRoutes = require('./routes/formatRoutes');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Validate environment variables
if (!validateEnv()) {
  process.exit(1);
}

// Connect to MongoDB
connectDB().catch(err => {
  console.error('Failed to connect to MongoDB', err);
  process.exit(1);
});

const app = express();
const server = http.createServer(app);
const io = setupSocket(server);

// Set up CORS options
const corsOptions = {
  origin: '*', // Allow all origins when serving from same host
  methods: 'GET,POST',
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Apply security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
}));
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api', documentRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/versions', versionRoutes);
app.use('/api/formats', formatRoutes);

// Serve static files from the React build
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Handle any requests that don't match the API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open your browser at http://localhost:${PORT}`);
});

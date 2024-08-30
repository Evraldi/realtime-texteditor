const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const setupSocket = require('./config/socket');
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = setupSocket(server);

// Set up CORS options
const corsOptions = {
  origin: 'http://localhost:3000', // Replace with your frontend URL
  methods: 'GET,POST',
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', documentRoutes);

server.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});

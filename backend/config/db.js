const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 * @returns {Promise<typeof mongoose>} Mongoose connection instance
 */
const connectDB = async () => {
  // Check if MONGO_URI is defined
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI environment variable is not defined');
    process.exit(1);
  }

  // Connection options with best practices
  const options = {
    // These options are no longer needed in Mongoose 6+, but kept as comments for reference
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    // useCreateIndex: true,
    // useFindAndModify: false,
    serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 30
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4 // Use IPv4, skip trying IPv6
  };

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, options);

    console.log(`MongoDB connected: ${conn.connection.host}`);

    // Set up connection event listeners
    mongoose.connection.on('error', err => {
      console.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Exit with failure
    process.exit(1);
  }
};

module.exports = connectDB;
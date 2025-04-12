/**
 * Centralized error handling for API responses
 * @param {Error} error - The error object
 * @param {string} context - Context message for the error
 * @param {object} res - Express response object
 */
exports.handleError = (error, context, res) => {
  // Log error details for debugging
  console.error(`${context}:`, error);

  // Determine appropriate status code based on error type
  let statusCode = 500;
  let message = 'Internal server error';

  // Special handling for Version validation errors
  if (error.name === 'ValidationError' && error._message === 'Version validation failed') {
    console.log('Handling Version validation error specifically');

    // Check if it's the content required error
    if (error.errors && error.errors.content && error.errors.content.kind === 'required') {
      // Try to fix the error by setting content to empty string
      try {
        if (error._doc) {
          error._doc.content = '';
          // Try to save again
          error._doc.save()
            .then(() => {
              console.log('Successfully saved Version with empty content');
            })
            .catch(saveErr => {
              console.error('Error saving Version with empty content:', saveErr);
            });
        }
      } catch (fixErr) {
        console.error('Error trying to fix Version content:', fixErr);
      }

      // Return a more helpful error message
      statusCode = 400;
      message = 'Document content cannot be empty. Please provide some content.';
    } else {
      // Handle other Version validation errors
      statusCode = 400;
      message = Object.values(error.errors)
        .map(err => err.message)
        .join(', ');
    }
  }
  // Handle other Mongoose validation errors
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(error.errors)
      .map(err => err.message)
      .join(', ');
  }
  // Handle Mongoose cast errors (e.g., invalid ObjectId)
  else if (error.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${error.path}: ${error.value}`;
  }
  // Handle duplicate key errors
  else if (error.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }
  // Handle JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  // Use custom error message if available
  else if (error.message) {
    message = error.message;
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    // Include stack trace in development but not in production
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
};

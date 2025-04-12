/**
 * Validates required environment variables and sets defaults for optional ones
 * @returns {boolean} True if all required variables are present
 */
const validateEnv = () => {
  // Required environment variables
  const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    console.error('Please check your .env file or environment configuration');
    return false;
  }

  // Set defaults for optional environment variables
  if (!process.env.PORT) {
    process.env.PORT = '5000';
    console.log('PORT environment variable not set, using default: 5000');
  }

  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
    console.log('NODE_ENV environment variable not set, using default: development');
  }

  if (!process.env.FRONTEND_URL) {
    process.env.FRONTEND_URL = 'http://localhost:3000';
    console.log('FRONTEND_URL environment variable not set, using default: http://localhost:3000');
  }

  // Validate JWT_SECRET in production
  if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET === 'monkey') {
    console.warn('WARNING: Using default JWT_SECRET in production is insecure!');
  }

  return true;
};

module.exports = validateEnv;

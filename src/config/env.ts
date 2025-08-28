import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment configuration with defaults
export const config = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000'),
  
  // Database
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '3306'),
  DB_NAME: process.env.DB_NAME || 'panchakarma',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'eyJ1c2VySWQiOjIsImVtYWlsIjoicGF0aWVudDNAeW9wbWFpbC5jb20iLCJyb2xlIjoiZG9jdG9yIiwidHlwZSI6I',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  
  // Email
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || '587'),
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'Panchakarma <noreply@panchakarma.com>',
  
  // SMS (Twilio)
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
  
  // File Upload
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880'),
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES || '.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.tif,.svg,.heic,.heif,.pdf',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute (60 seconds)
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per minute
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE_PATH: process.env.LOG_FILE_PATH || './logs',
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Security
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),
  SESSION_SECRET: process.env.SESSION_SECRET || 'fallback-session-secret',
  
  // Development
  DEBUG: process.env.DEBUG === 'true',
  SHOW_SQL_LOGS: process.env.SHOW_SQL_LOGS === 'true',

  //File Url
  FILE_URL: process.env.FILE_URL || 'http://localhost:3000/',

  DUMMY_USER_IMAGE: process.env.DUMMY_USER_IMAGE || 'http://localhost:3000/public/images/dummy-user.png',

  //Agora
  AGORA_APP_ID: process.env.AGORA_APP_ID || '',
  AGORA_APP_CERTIFICATE: process.env.AGORA_APP_CERTIFICATE || '',
  AGORA_APP_CERTIFICATE_SECRET: process.env.AGORA_APP_CERTIFICATE_SECRET || '',
  AGORA_APP_CERTIFICATE_ID: process.env.AGORA_APP_CERTIFICATE_ID || '',
  AGORA_APP_CERTIFICATE_SECRET_ID: process.env.AGORA_APP_CERTIFICATE_SECRET_ID || '',
  AGORA_APP_CERTIFICATE_SECRET_SECRET: process.env.AGORA_APP_CERTIFICATE_SECRET_SECRET || '',
};

// Helper function to check if required env vars are set
export const validateEnv = () => {
  const required = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'EMAIL_HOST',
    'EMAIL_USER',
    'EMAIL_PASSWORD',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn('⚠️  Missing environment variables:', missing.join(', '));
    console.warn('Please check your .env file');
  }
  
  return missing.length === 0;
};

// Export individual config values for backward compatibility
export const {
  NODE_ENV,
  PORT,
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN,
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASSWORD,
  EMAIL_FROM,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  UPLOAD_PATH,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  LOG_LEVEL,
  LOG_FILE_PATH,
  CORS_ORIGIN,
  BCRYPT_SALT_ROUNDS,
  SESSION_SECRET,
  DEBUG,
  SHOW_SQL_LOGS,
  FILE_URL,
  DUMMY_USER_IMAGE
} = config; 
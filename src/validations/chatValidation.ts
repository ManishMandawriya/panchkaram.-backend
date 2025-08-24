import Joi from 'joi';
import { SessionType } from '../models/ChatSession';
import { MessageType } from '../models/ChatMessage';

// Verify session validation schema
export const verifySessionSchema = Joi.object({
  userRole: Joi.string().valid('patient', 'doctor').required().messages({
    'any.only': 'User role must be either patient or doctor',
    'any.required': 'User role is required',
  }),
});

// Create session validation schema
export const createSessionSchema = Joi.object({
  doctorId: Joi.number().integer().positive().required().messages({
    'number.base': 'Doctor ID must be a number',
    'number.integer': 'Doctor ID must be an integer',
    'number.positive': 'Doctor ID must be positive',
    'any.required': 'Doctor ID is required',
  }),
  sessionType: Joi.string().valid(...Object.values(SessionType)).required().messages({
    'any.only': 'Session type must be one of: chat, audioCall, videoCall',
    'any.required': 'Session type is required',
  }),
  sessionToken: Joi.string().optional().messages({
    'string.base': 'Session token must be a string',
  }),
});

// Join session validation schema
export const joinSessionSchema = Joi.object({
  userRole: Joi.string().valid('patient', 'doctor').required().messages({
    'any.only': 'User role must be either patient or doctor',
    'any.required': 'User role is required',
  }),
});

// Send message validation schema
export const sendMessageSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required().messages({
    'string.empty': 'Message content cannot be empty',
    'string.min': 'Message content must be at least 1 character',
    'string.max': 'Message content cannot exceed 2000 characters',
    'any.required': 'Message content is required',
  }),
  messageType: Joi.string().valid(...Object.values(MessageType)).default('text').messages({
    'any.only': 'Message type must be one of: text, image, file, audio, video, system',
  }),
  fileUrl: Joi.string().uri().optional().messages({
    'string.uri': 'File URL must be a valid URI',
  }),
  fileName: Joi.string().max(255).optional().messages({
    'string.max': 'File name cannot exceed 255 characters',
  }),
  fileType: Joi.string().max(100).optional().messages({
    'string.max': 'File type cannot exceed 100 characters',
  }),
  fileSize: Joi.number().integer().positive().max(50 * 1024 * 1024).optional().messages({
    'number.base': 'File size must be a number',
    'number.integer': 'File size must be an integer',
    'number.positive': 'File size must be positive',
    'number.max': 'File size cannot exceed 50MB',
  }),
  replyToMessageId: Joi.string().uuid().optional().messages({
    'string.guid': 'Reply to message ID must be a valid UUID',
  }),
}).custom((value, helpers) => {
  // Validate file-related fields when message type is not text
  if (value.messageType !== 'text' && value.messageType !== 'system') {
    if (!value.fileUrl) {
      return helpers.error('any.invalid', { 
        message: 'File URL is required for non-text messages' 
      });
    }
    if (!value.fileName) {
      return helpers.error('any.invalid', { 
        message: 'File name is required for non-text messages' 
      });
    }
    if (!value.fileType) {
      return helpers.error('any.invalid', { 
        message: 'File type is required for non-text messages' 
      });
    }
  }

  // Validate file size is provided when file URL is provided
  if (value.fileUrl && !value.fileSize) {
    return helpers.error('any.invalid', { 
      message: 'File size is required when file URL is provided' 
    });
  }

  return value;
});

// Mark messages as read validation schema
export const markMessagesReadSchema = Joi.object({
  messageIds: Joi.array().items(
    Joi.number().integer().positive()
  ).optional().messages({
    'array.base': 'Message IDs must be an array',
  }),
});

// End session validation schema
export const endSessionSchema = Joi.object({
  // No additional fields needed for ending session
});

// Get messages query validation schema
export const getMessagesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),
  limit: Joi.number().integer().min(1).max(100).default(50).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),
  status: Joi.string().valid('sent', 'delivered', 'read', 'failed', 'pending').optional().messages({
    'any.only': 'Status must be one of: sent, delivered, read, failed, pending',
  }),
  messageType: Joi.string().valid(...Object.values(MessageType)).optional().messages({
    'any.only': 'Message type must be one of: text, image, file, audio, video, system',
  }),
  beforeDate: Joi.date().iso().optional().messages({
    'date.base': 'Before date must be a valid date',
  }),
  afterDate: Joi.date().iso().optional().messages({
    'date.base': 'After date must be a valid date',
  }),
});

// Get sessions query validation schema
export const getSessionsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),
  limit: Joi.number().integer().min(1).max(50).default(10).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 50',
  }),
  status: Joi.string().valid('scheduled', 'ongoing', 'ended', 'canceled').optional().messages({
    'any.only': 'Status must be one of: scheduled, ongoing, ended, canceled',
  }),
  sessionType: Joi.string().valid(...Object.values(SessionType)).optional().messages({
    'any.only': 'Session type must be one of: chat, audioCall, videoCall',
  }),
});

import Joi from 'joi';

// Initiate call validation schema
export const initiateCallSchema = Joi.object({
  sessionId: Joi.string().required().messages({
    'string.base': 'Session ID must be a string',
    'any.required': 'Session ID is required',
  }),
  callType: Joi.string().valid('audio_call', 'video_call').required().messages({
    'any.only': 'Call type must be either audio_call or video_call',
    'any.required': 'Call type is required',
  }),
});

// Answer call validation schema
export const answerCallSchema = Joi.object({
  sessionId: Joi.string().required().messages({
    'string.base': 'Session ID must be a string',
    'any.required': 'Session ID is required',
  }),
});

// Decline call validation schema
export const declineCallSchema = Joi.object({
  sessionId: Joi.string().required().messages({
    'string.base': 'Session ID must be a string',
    'any.required': 'Session ID is required',
  }),
  reason: Joi.string().max(255).optional().messages({
    'string.base': 'Reason must be a string',
    'string.max': 'Reason cannot exceed 255 characters',
  }),
});

// End call validation schema
export const endCallSchema = Joi.object({
  sessionId: Joi.string().required().messages({
    'string.base': 'Session ID must be a string',
    'any.required': 'Session ID is required',
  }),
});

// Mark call as missed validation schema
export const markCallMissedSchema = Joi.object({
  sessionId: Joi.string().required().messages({
    'string.base': 'Session ID must be a string',
    'any.required': 'Session ID is required',
  }),
});


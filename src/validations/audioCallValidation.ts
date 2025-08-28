import Joi from 'joi';

// Create audio call session validation
export const createAudioCallSessionSchema = Joi.object({
  body: Joi.object({})
});

// Join audio call session validation
export const joinAudioCallSessionSchema = Joi.object({
  params: Joi.object({
    sessionId: Joi.string().required()
      .messages({
        'string.empty': 'Session ID cannot be empty',
        'any.required': 'Session ID is required'
      })
  }),
  body: Joi.object({
    userType: Joi.string().valid('user1', 'user2').required()
      .messages({
        'string.empty': 'User type cannot be empty',
        'any.only': 'User type must be either "user1" or "user2"',
        'any.required': 'User type is required'
      })
  })
});

// End audio call session validation
export const endAudioCallSessionSchema = Joi.object({
  params: Joi.object({
    sessionId: Joi.string().required()
      .messages({
        'string.empty': 'Session ID cannot be empty',
        'any.required': 'Session ID is required'
      })
  })
});

// Get audio call session validation
export const getAudioCallSessionSchema = Joi.object({
  params: Joi.object({
    sessionId: Joi.string().required()
      .messages({
        'string.empty': 'Session ID cannot be empty',
        'any.required': 'Session ID is required'
      })
  })
});

// Refresh token validation
export const refreshTokenSchema = Joi.object({
  params: Joi.object({
    sessionId: Joi.string().required()
      .messages({
        'string.empty': 'Session ID cannot be empty',
        'any.required': 'Session ID is required'
      })
  }),
  body: Joi.object({
    userType: Joi.string().valid('user1', 'user2').required()
      .messages({
        'string.empty': 'User type cannot be empty',
        'any.only': 'User type must be either "user1" or "user2"',
        'any.required': 'User type is required'
      })
  })
});

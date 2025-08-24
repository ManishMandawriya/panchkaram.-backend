import Joi from 'joi';
import { CreateReviewRequest, UpdateReviewRequest, ReviewFilters } from '../types/review';

export const createReviewSchema = Joi.object<CreateReviewRequest>({
  doctorId: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'Doctor ID must be a number',
      'number.integer': 'Doctor ID must be an integer',
      'number.positive': 'Doctor ID must be positive',
      'any.required': 'Doctor ID is required',
    }),
  rating: Joi.number().integer().min(1).max(5).required()
    .messages({
      'number.base': 'Rating must be a number',
      'number.integer': 'Rating must be an integer',
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating must be at most 5',
      'any.required': 'Rating is required',
    }),
  comment: Joi.string().max(250).optional()
    .messages({
      'string.max': 'Comment must not exceed 250 characters',
    }),
  isRecommended: Joi.boolean().required()
    .messages({
      'boolean.base': 'Recommendation must be a boolean',
      'any.required': 'Recommendation is required',
    }),
});

export const updateReviewSchema = Joi.object<UpdateReviewRequest>({
  rating: Joi.number().integer().min(1).max(5).optional()
    .messages({
      'number.base': 'Rating must be a number',
      'number.integer': 'Rating must be an integer',
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating must be at most 5',
    }),
  comment: Joi.string().max(250).optional()
    .messages({
      'string.max': 'Comment must not exceed 250 characters',
    }),
  isRecommended: Joi.boolean().optional()
    .messages({
      'boolean.base': 'Recommendation must be a boolean',
    }),
});

export const getReviewsSchema = Joi.object<ReviewFilters>({
  doctorId: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'Doctor ID must be a number',
      'number.integer': 'Doctor ID must be an integer',
      'number.positive': 'Doctor ID must be positive',
    }),
  patientId: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'Patient ID must be a number',
      'number.integer': 'Patient ID must be an integer',
      'number.positive': 'Patient ID must be positive',
    }),
  rating: Joi.number().integer().min(1).max(5).optional()
    .messages({
      'number.base': 'Rating must be a number',
      'number.integer': 'Rating must be an integer',
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating must be at most 5',
    }),
  isRecommended: Joi.boolean().optional()
    .messages({
      'boolean.base': 'Recommendation must be a boolean',
    }),
  startDate: Joi.date().optional()
    .messages({
      'date.base': 'Start date must be a valid date',
    }),
  endDate: Joi.date().min(Joi.ref('startDate')).optional()
    .messages({
      'date.base': 'End date must be a valid date',
      'date.min': 'End date must be after start date',
    }),
  page: Joi.number().integer().min(1).default(1).optional()
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1',
    }),
  limit: Joi.number().integer().min(1).max(100).default(10).optional()
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must be at most 100',
    }),
  sortBy: Joi.string().valid('createdAt', 'rating').default('createdAt').optional()
    .messages({
      'string.base': 'Sort by must be a string',
      'any.only': 'Sort by must be either "createdAt" or "rating"',
    }),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC').optional()
    .messages({
      'string.base': 'Sort order must be a string',
      'any.only': 'Sort order must be either "ASC" or "DESC"',
    }),
});

export const reviewIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'Review ID must be a number',
      'number.integer': 'Review ID must be an integer',
      'number.positive': 'Review ID must be positive',
      'any.required': 'Review ID is required',
    }),
}); 
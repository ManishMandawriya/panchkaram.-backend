import Joi from 'joi';
import { CategoryStatus } from '../models/Category';

// Create category validation schema
export const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Category name must be at least 2 characters long',
    'string.max': 'Category name must be less than 255 characters',
    'any.required': 'Category name is required',
  }),
  description: Joi.string().max(1000).optional().messages({
    'string.max': 'Description must be less than 1000 characters',
  }),
  sortOrder: Joi.number().integer().min(0).optional().messages({
    'number.base': 'Sort order must be a number',
    'number.integer': 'Sort order must be an integer',
    'number.min': 'Sort order must be 0 or greater',
  }),
});

// Update category validation schema
export const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(255).optional().messages({
    'string.min': 'Category name must be at least 2 characters long',
    'string.max': 'Category name must be less than 255 characters',
  }),
  description: Joi.string().max(1000).optional().messages({
    'string.max': 'Description must be less than 1000 characters',
  }),
  sortOrder: Joi.number().integer().min(0).optional().messages({
    'number.base': 'Sort order must be a number',
    'number.integer': 'Sort order must be an integer',
    'number.min': 'Sort order must be 0 or greater',
  }),
  status: Joi.string().valid(...Object.values(CategoryStatus)).optional().messages({
    'any.only': 'Invalid status value',
  }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive must be a boolean value',
  }),
});

// Change status validation schema
export const changeStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(CategoryStatus)).required().messages({
    'any.only': 'Invalid status value',
    'any.required': 'Status is required',
  }),
});

// Pagination and search validation schema
export const getCategoriesSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be 1 or greater',
  }),
  limit: Joi.number().integer().min(1).max(100).optional().messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be 1 or greater',
    'number.max': 'Limit must be 100 or less',
  }),
  search: Joi.string().max(255).optional().messages({
    'string.max': 'Search term must be less than 255 characters',
  }),
}); 
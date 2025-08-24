import Joi from 'joi';
import { AppointmentStatus } from '../types/appointment';

// Update appointment status validation schema
export const updateAppointmentStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(AppointmentStatus))
    .required()
    .messages({
      'any.only': 'Please select a valid appointment status',
      'any.required': 'Appointment status is required',
    }),
  
  notes: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Notes cannot exceed 500 characters',
    }),
});

// Appointment filters validation schema
export const appointmentFiltersSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(AppointmentStatus))
    .optional()
    .messages({
      'any.only': 'Please select a valid appointment status',
    }),
  
  startDate: Joi.date()
    .optional()
    .messages({
      'date.base': 'Start date must be a valid date',
    }),
  
  endDate: Joi.date()
    .min(Joi.ref('startDate'))
    .optional()
    .messages({
      'date.base': 'End date must be a valid date',
      'date.min': 'End date must be after start date',
    }),
  
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1',
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
    }),
  
  sortBy: Joi.string()
    .valid('appointmentDate', 'createdAt', 'patientName')
    .optional()
    .default('appointmentDate')
    .messages({
      'any.only': 'Sort by must be appointmentDate, createdAt, or patientName',
    }),
  
  sortOrder: Joi.string()
    .valid('ASC', 'DESC')
    .optional()
    .default('ASC')
    .messages({
      'any.only': 'Sort order must be ASC or DESC',
    }),
});

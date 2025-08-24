import Joi from 'joi';

// Time range validation schema
const timeRangeSchema = Joi.object({
  startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9] (AM|PM)$/).required().messages({
    'string.pattern.base': 'Start time must be in HH:MM AM/PM format',
    'any.required': 'Start time is required',
  }),
  endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9] (AM|PM)$/).required().messages({
    'string.pattern.base': 'End time must be in HH:MM AM/PM format',
    'any.required': 'End time is required',
  }),
  slotDuration: Joi.number().integer().min(15).max(120).default(30).messages({
    'number.base': 'Slot duration must be a number',
    'number.integer': 'Slot duration must be an integer',
    'number.min': 'Slot duration must be at least 15 minutes',
    'number.max': 'Slot duration must be at most 120 minutes',
  }),
});

// Day schedule validation schema
const dayScheduleSchema = Joi.object({
  day: Joi.string().valid('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday').required().messages({
    'any.only': 'Day must be one of: sunday, monday, tuesday, wednesday, thursday, friday, saturday',
    'any.required': 'Day is required',
  }),
  isAvailable: Joi.boolean().required().messages({
    'boolean.base': 'isAvailable must be a boolean',
    'any.required': 'isAvailable is required',
  }),
  timeRanges: Joi.array().items(timeRangeSchema).default([]).messages({
    'array.base': 'timeRanges must be an array',
  }),
});

// Week schedule validation schema
export const weekScheduleSchema = Joi.object({
  weekSchedule: Joi.array().items(dayScheduleSchema).length(7).required().messages({
    'array.base': 'weekSchedule must be an array',
    'array.length': 'weekSchedule must contain exactly 7 days',
    'any.required': 'weekSchedule is required',
  }),
}).custom((value, helpers) => {
  // Validate that end time is after start time for each time range
  const { weekSchedule } = value;
  
  for (const daySchedule of weekSchedule) {
    for (const timeRange of daySchedule.timeRanges) {
      const startTime = new Date(`2000-01-01 ${timeRange.startTime}`);
      const endTime = new Date(`2000-01-01 ${timeRange.endTime}`);
      
      if (endTime <= startTime) {
        return helpers.error('any.invalid', { 
          message: `${daySchedule.day} end time must be after start time` 
        });
      }
    }
  }
  
  return value;
});

// Generate time slots schema
export const generateTimeSlotsSchema = Joi.object({
  dayOfWeek: Joi.number().integer().min(0).max(6).required(),
  startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  slotDuration: Joi.number().integer().min(15).max(120).default(30),
  breakTime: Joi.number().integer().min(0).max(240).default(60),
  breakStartTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  breakEndTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
}).custom((value, helpers) => {
  const startTime = new Date(`2000-01-01 ${value.startTime}`);
  const endTime = new Date(`2000-01-01 ${value.endTime}`);
  
  if (endTime <= startTime) {
    return helpers.error('any.invalid', { 
      message: 'End time must be after start time' 
    });
  }
  
  if (value.breakStartTime && value.breakEndTime) {
    const breakStart = new Date(`2000-01-01 ${value.breakStartTime}`);
    const breakEnd = new Date(`2000-01-01 ${value.breakEndTime}`);
    
    if (breakEnd <= breakStart) {
      return helpers.error('any.invalid', { 
        message: 'Break end time must be after break start time' 
      });
    }
    
    if (breakStart < startTime || breakEnd > endTime) {
      return helpers.error('any.invalid', { 
        message: 'Break time must be within working hours' 
      });
    }
  }
  
  return value;
});

// Update time slot schema
export const updateTimeSlotSchema = Joi.object({
  isAvailable: Joi.boolean().required(),
  duration: Joi.number().integer().min(15).max(120).optional(),
});

// Bulk update time slots schema
export const bulkUpdateTimeSlotsSchema = Joi.object({
  dayOfWeek: Joi.number().integer().min(0).max(6).required(),
  updates: Joi.array().items(
    Joi.object({
      id: Joi.number().integer().positive().required(),
      isAvailable: Joi.boolean().required(),
      duration: Joi.number().integer().min(15).max(120).optional(),
    })
  ).min(1).required(),
});

// Copy schedule schema
export const copyScheduleSchema = Joi.object({
  fromDay: Joi.number().integer().min(0).max(6).required(),
  toDay: Joi.number().integer().min(0).max(6).required(),
  overwrite: Joi.boolean().default(false),
});

// Time slots query schema
export const timeSlotsQuerySchema = Joi.object({
  dayOfWeek: Joi.number().integer().min(0).max(6).optional(),
  date: Joi.date().optional(),
  isAvailable: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
});

// Availability calendar query schema
export const availabilityCalendarSchema = Joi.object({
  startDate: Joi.date().required(),
  endDate: Joi.date().min(Joi.ref('startDate')).required(),
  includeBooked: Joi.boolean().default(false),
});


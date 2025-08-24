import Joi from 'joi';
import { ServiceType } from '../models/DoctorService';
import { DayOfWeek } from '../models/DoctorAvailability';

export const updateDoctorServicesSchema = Joi.object({
  chat: Joi.object({
    price: Joi.number().min(0).max(99999.99).optional(),
    isEnabled: Joi.boolean().optional(),
    description: Joi.string().optional().allow(''),
    duration: Joi.number().integer().min(15).max(180).optional(),
  }).optional(),
  audioCall: Joi.object({
    price: Joi.number().min(0).max(99999.99).optional(),
    isEnabled: Joi.boolean().optional(),
    description: Joi.string().optional().allow(''),
    duration: Joi.number().integer().min(15).max(180).optional(),
  }).optional(),
  videoCall: Joi.object({
    price: Joi.number().min(0).max(99999.99).optional(),
    isEnabled: Joi.boolean().optional(),
    description: Joi.string().optional().allow(''),
    duration: Joi.number().integer().min(15).max(180).optional(),
  }).optional(),
});

export const updateDoctorAvailabilitySchema = Joi.object({
  availability: Joi.array().items(
    Joi.object({
      dayOfWeek: Joi.string().valid(...Object.values(DayOfWeek)).required(),
      startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).required(),
      endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).required(),
      isAvailable: Joi.boolean().required(),
      slotDuration: Joi.number().integer().min(15).max(180).optional().default(30),
      breakTime: Joi.number().integer().min(0).max(60).optional().default(0),
    })
  ).min(1).required(),
});

export const doctorIdParamSchema = Joi.object({
  doctorId: Joi.number().integer().positive().required(),
});
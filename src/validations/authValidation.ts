import { UserRole } from '../types/auth';
import Joi from 'joi';

// Login validation schema
export const loginSchema = Joi.object({
  phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required().messages({
    'string.pattern.base': 'Please enter a valid phone number',
    'any.required': 'Phone number is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required',
  }),
});

// Registration validation schema
export const registerSchema = Joi.object({
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .required()
    .messages({
      'any.only': 'Please select a valid role',
      'any.required': 'Role is required',
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required',
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required',
    }),

  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Password confirmation is required',
  }),

  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please enter a valid 10-digit phone number',
      'any.required': 'Phone number is required',
    }),

  fullName: Joi.when('role', {
    is: Joi.string().valid(UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN),
    then: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Full name must be at least 2 characters long',
      'string.max': 'Full name must not exceed 100 characters',
      'any.required': 'Full name is required',
    }),
    otherwise: Joi.string().optional(),
  }),

  clinicName: Joi.when('role', {
    is: UserRole.CLINIC,
    then: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Clinic name must be at least 2 characters long',
      'string.max': 'Clinic name must not exceed 100 characters',
      'any.required': 'Clinic name is required',
    }),
    otherwise: Joi.string().optional(),
  }),

  doctorId: Joi.when('role', {
    is: Joi.string().valid(UserRole.DOCTOR, UserRole.CLINIC),
    then: Joi.string().min(3).max(50).required().messages({
      'string.min': 'Doctor ID must be at least 3 characters long',
      'string.max': 'Doctor ID must not exceed 50 characters',
      'any.required': 'Doctor ID is required',
    }),
    otherwise: Joi.string().optional(),
  }),

  departmentId: Joi.when('role', {
    is: Joi.string().valid(UserRole.DOCTOR, UserRole.CLINIC),
    then: Joi.number().integer().positive().required().messages({
      'number.base': 'Department ID must be a valid number',
      'number.integer': 'Department ID must be an integer',
      'number.positive': 'Department ID must be a positive number',
      'any.required': 'Department ID is required for doctors and clinics',
    }),
    otherwise: Joi.number().optional(),
  }),

  experience: Joi.when('role', {
    is: Joi.string().valid(UserRole.DOCTOR, UserRole.CLINIC),
    then: Joi.string().min(1).max(500).required().messages({
      'string.min': 'Experience must be at least 1 character long',
      'string.max': 'Experience must not exceed 500 characters',
      'any.required': 'Experience is required',
    }),
    otherwise: Joi.string().optional(),
  }),

  specializations: Joi.when('role', {
    is: Joi.string().valid(UserRole.DOCTOR, UserRole.CLINIC),
    then: Joi.array().items(Joi.string().min(1).max(100)).optional().messages({
      'array.base': 'Specializations must be an array',
      'string.min': 'Each specialization must be at least 1 character long',
      'string.max': 'Each specialization must not exceed 100 characters',
    }),
    otherwise: Joi.array().optional(),
  }),
});

// Forgot password validation schema
export const forgotPasswordSchema = Joi.object({
  phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required().messages({
    'string.pattern.base': 'Please enter a valid phone number',
    'any.required': 'Phone number is required',
  }),
});

// Verify code validation schema
export const verifyCodeSchema = Joi.object({
  phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required().messages({
    'string.pattern.base': 'Please enter a valid phone number',
    'any.required': 'Phone number is required',
  }),
  code: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
    'string.length': 'Verification code must be 6 digits',
    'string.pattern.base': 'Verification code must contain only digits',
    'any.required': 'Verification code is required',
  }),
});

// Reset password validation schema
export const resetPasswordSchema = Joi.object({
  phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required().messages({
    'string.pattern.base': 'Please enter a valid phone number',
    'any.required': 'Phone number is required',
  }),
  code: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
    'string.length': 'Verification code must be 6 digits',
    'string.pattern.base': 'Verification code must contain only digits',
    'any.required': 'Verification code is required',
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'New password must be at least 6 characters long',
    'any.required': 'New password is required',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Password confirmation is required',
  }),
});

// Change password validation schema
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required',
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'New password must be at least 6 characters long',
    'any.required': 'New password is required',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Password confirmation is required',
  }),
});

// Update profile validation schema
export const updateProfileSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Full name must be at least 2 characters long',
    'string.max': 'Full name cannot exceed 100 characters',
    'any.required': 'Full name is required',
  }),
  
  // email: Joi.string().email().required().messages({
  //   'string.email': 'Please enter a valid email address',
  //   'any.required': 'Email is required',
  // }),
  
  email: Joi.string().optional(),
  // phoneNumber: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
  //   'string.pattern.base': 'Please enter a valid 10-digit phone number',
  //   'any.required': 'Phone number is required',
  // }),
  
  phoneNumber: Joi.string().optional(),
  location: Joi.string().optional(),
  
  gender: Joi.string().valid('male', 'female', 'other').required().messages({
    'any.only': 'Gender must be male, female, or other',
    'any.required': 'Gender is required',
  }),
  
  dateOfBirth: Joi.date().max('now').required().messages({
    'date.max': 'Date of birth cannot be in the future',
    'any.required': 'Date of birth is required',
  }),
  
  aboutYourself: Joi.string().optional().messages({
    'string.base': 'About yourself must be a string',
  }),
}); 
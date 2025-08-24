import Joi from 'joi';

export const createBannerSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  slug: Joi.string().min(1).max(255).pattern(/^[a-z0-9-]+$/).required()
    .messages({
      'string.pattern.base': 'Slug must contain only lowercase letters, numbers, and hyphens'
    }),
  image: Joi.string().uri().max(500).required(),
  description: Joi.string().max(1000).optional().allow(''),
  linkUrl: Joi.string().uri().max(255).optional().allow(''),
  sortOrder: Joi.number().integer().min(0).max(9999).optional().default(0),
  isActive: Joi.boolean().optional().default(true),
  startDate: Joi.date().iso().optional().allow(null),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional().allow(null)
    .messages({
      'date.min': 'End date must be after start date'
    }),
});

export const updateBannerSchema = Joi.object({
  title: Joi.string().min(1).max(255).optional(),
  slug: Joi.string().min(1).max(255).pattern(/^[a-z0-9-]+$/).optional()
    .messages({
      'string.pattern.base': 'Slug must contain only lowercase letters, numbers, and hyphens'
    }),
  image: Joi.string().uri().max(500).optional(),
  description: Joi.string().max(1000).optional().allow(''),
  linkUrl: Joi.string().uri().max(255).optional().allow(''),
  sortOrder: Joi.number().integer().min(0).max(9999).optional(),
  isActive: Joi.boolean().optional(),
  startDate: Joi.date().iso().optional().allow(null),
  endDate: Joi.date().iso().optional().allow(null),
});

export const bannerIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const bannerSlugParamSchema = Joi.object({
  slug: Joi.string().min(1).max(255).required(),
});

export const getBannersQuerySchema = Joi.object({
  includeInactive: Joi.boolean().optional().default(false),
  limit: Joi.number().integer().min(1).max(50).optional().default(10),
  page: Joi.number().integer().min(1).optional().default(1),
});
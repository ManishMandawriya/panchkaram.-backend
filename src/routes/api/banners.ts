import { Router } from 'express';
import { BannerController } from '../../controllers/api/bannerController';
import { authMiddleware } from '../../middleware/authMiddleware';
import { validateRequest } from '../../middleware/validateRequest';
import {
  createBannerSchema,
  updateBannerSchema,
  bannerIdParamSchema,
  bannerSlugParamSchema,
  getBannersQuerySchema,
} from '../../validations/bannerValidation';

const router = Router();

// Public routes
// GET /api/banners - Get all active banners
router.get(
  '/',
  validateRequest(getBannersQuerySchema, 'query'),
  BannerController.getBanners
);

// GET /api/banners/slug/:slug - Get banner by slug
router.get(
  '/slug/:slug',
  validateRequest(bannerSlugParamSchema, 'params'),
  BannerController.getBannerBySlug
);

// Protected routes (admin only)
// POST /api/banners - Create new banner
router.post(
  '/',
  authMiddleware,
  validateRequest(createBannerSchema, 'body'),
  BannerController.createBanner
);

// PUT /api/banners/:id - Update banner
router.put(
  '/:id',
  authMiddleware,
  validateRequest(updateBannerSchema, 'body'),
  validateRequest(bannerIdParamSchema, 'params'),
  BannerController.updateBanner
);

// DELETE /api/banners/:id - Delete banner
router.delete(
  '/:id',
  authMiddleware,
  validateRequest(bannerIdParamSchema, 'params'),
  BannerController.deleteBanner
);

export default router;
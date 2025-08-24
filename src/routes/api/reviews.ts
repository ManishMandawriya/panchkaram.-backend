import { Router } from 'express';
import { ReviewController } from '../../controllers/api/reviewController';
import { validateRequest } from '../../middleware/validateRequest';
import { authMiddleware } from '../../middleware/authMiddleware';
import { 
  createReviewSchema, 
  updateReviewSchema, 
  getReviewsSchema, 
  reviewIdSchema 
} from '../../validations/reviewValidation';

const router = Router();
const reviewController = new ReviewController();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// POST /api/reviews - Create a new review
router.post(
  '/',
  validateRequest(createReviewSchema),
  reviewController.createReview.bind(reviewController)
);

// GET /api/reviews - Get all reviews with filters
router.get(
  '/',
  validateRequest(getReviewsSchema, 'query'),
  reviewController.getReviews.bind(reviewController)
);

// GET /api/reviews/statistics - Get review statistics
router.get(
  '/statistics',
  reviewController.getReviewStatistics.bind(reviewController)
);

// GET /api/reviews/doctor/:doctorId - Get reviews by doctor
router.get(
  '/doctor/:doctorId',
  reviewController.getReviewsByDoctor.bind(reviewController)
);

// GET /api/reviews/patient/me - Get current user's reviews
router.get(
  '/patient/me',
  reviewController.getMyReviews.bind(reviewController)
);

// GET /api/reviews/:id - Get review by ID
router.get(
  '/:id',
  validateRequest(reviewIdSchema, 'params'),
  reviewController.getReviewById.bind(reviewController)
);

// PUT /api/reviews/:id - Update review
router.put(
  '/:id',
  validateRequest(reviewIdSchema, 'params'),
  validateRequest(updateReviewSchema),
  reviewController.updateReview.bind(reviewController)
);

// DELETE /api/reviews/:id - Delete review
router.delete(
  '/:id',
  validateRequest(reviewIdSchema, 'params'),
  reviewController.deleteReview.bind(reviewController)
);

export default router; 
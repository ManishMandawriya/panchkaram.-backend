import { Router } from 'express';
import { DoctorReviewController } from '../../controllers/api/doctorReviewController';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();
const doctorReviewController = new DoctorReviewController();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// GET /api/doctor/reviews - Get doctor's reviews
router.get('/', doctorReviewController.getDoctorReviews.bind(doctorReviewController));

// GET /api/doctor/reviews/statistics - Get review statistics
router.get('/statistics', doctorReviewController.getReviewStatistics.bind(doctorReviewController));

// GET /api/doctor/reviews/:id - Get specific review
router.get('/:id', doctorReviewController.getReviewById.bind(doctorReviewController));

// DELETE /api/doctor/reviews/:id - Delete review
router.delete('/:id', doctorReviewController.deleteReview.bind(doctorReviewController));

export default router;

import { Request, Response } from 'express';
import { DoctorReviewService } from '../../services/doctorReviewService';
import { logger } from '../../utils/logger';

export class DoctorReviewController {
  private doctorReviewService: DoctorReviewService;

  constructor() {
    this.doctorReviewService = new DoctorReviewService();
  }

  // GET /api/doctor/reviews - Get doctor's reviews
  async getDoctorReviews(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const { page, limit, rating, sortBy, sortOrder } = req.query;

      if (!doctorId || userRole !== 'doctor') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Only doctors can access this endpoint.',
        });
        return;
      }

      const filters = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        rating: rating ? parseInt(rating as string) : undefined,
        sortBy: sortBy as 'createdAt' | 'rating' || 'createdAt',
        sortOrder: sortOrder as 'ASC' | 'DESC' || 'DESC',
      };

      const result = await this.doctorReviewService.getDoctorReviews(doctorId, filters);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Get doctor reviews controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve reviews. Please try again.',
      });
    }
  }

  // GET /api/doctor/reviews/:id - Get specific review
  async getReviewById(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const reviewId = parseInt(req.params.id);

      if (!doctorId || userRole !== 'doctor') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Only doctors can access this endpoint.',
        });
        return;
      }

      if (isNaN(reviewId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid review ID',
        });
        return;
      }

      const result = await this.doctorReviewService.getReviewById(doctorId, reviewId);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Get review by ID controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve review. Please try again.',
      });
    }
  }

  // DELETE /api/doctor/reviews/:id - Delete review
  async deleteReview(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const reviewId = parseInt(req.params.id);

      if (!doctorId || userRole !== 'doctor') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Only doctors can access this endpoint.',
        });
        return;
      }

      if (isNaN(reviewId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid review ID',
        });
        return;
      }

      const result = await this.doctorReviewService.deleteReview(doctorId, reviewId);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Delete review controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete review. Please try again.',
      });
    }
  }

  // GET /api/doctor/reviews/statistics - Get review statistics
  async getReviewStatistics(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      if (!doctorId || userRole !== 'doctor') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Only doctors can access this endpoint.',
        });
        return;
      }

      const result = await this.doctorReviewService.getReviewStatistics(doctorId);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Get review statistics controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve review statistics. Please try again.',
      });
    }
  }
}

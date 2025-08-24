import { Request, Response } from 'express';
import { ReviewService } from '../../services/reviewService';
import { logger } from '../../utils/logger';
import { CreateReviewRequest, UpdateReviewRequest, ReviewFilters } from '../../types/review';

export class ReviewController {
  private reviewService: ReviewService;

  constructor() {
    this.reviewService = new ReviewService();
  }

  // POST /api/reviews
  async createReview(req: Request, res: Response): Promise<void> {
    try {
      const patientId = (req as any).user?.userId;
      const reviewData: CreateReviewRequest = req.body;

      const result = await this.reviewService.createReview(patientId, reviewData);
      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      logger.error('Create review controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create review. Please try again.',
      });
    }
  }

  // GET /api/reviews
  async getReviews(req: Request, res: Response): Promise<void> {
    try {
      const filters: ReviewFilters = {
        doctorId: req.query.doctorId ? parseInt(req.query.doctorId as string) : undefined,
        patientId: req.query.patientId ? parseInt(req.query.patientId as string) : undefined,
        rating: req.query.rating ? parseInt(req.query.rating as string) : undefined,
        isRecommended: req.query.isRecommended !== undefined ? req.query.isRecommended === 'true' : undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as 'createdAt' | 'rating' || 'createdAt',
        sortOrder: req.query.sortOrder as 'ASC' | 'DESC' || 'DESC',
      };

      const result = await this.reviewService.getReviews(filters);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Get reviews controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve reviews. Please try again.',
      });
    }
  }

  // GET /api/reviews/:id
  async getReviewById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid review ID',
        });
        return;
      }

      const result = await this.reviewService.getReviewById(id);
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error('Get review by ID controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve review. Please try again.',
      });
    }
  }

  // PUT /api/reviews/:id
  async updateReview(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const patientId = (req as any).user?.userId;
      const updateData: UpdateReviewRequest = req.body;

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid review ID',
        });
        return;
      }

      const result = await this.reviewService.updateReview(id, patientId, updateData);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Update review controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update review. Please try again.',
      });
    }
  }

  // DELETE /api/reviews/:id
  async deleteReview(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const patientId = (req as any).user?.userId;

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid review ID',
        });
        return;
      }

      const result = await this.reviewService.deleteReview(id, patientId);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Delete review controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete review. Please try again.',
      });
    }
  }

  // GET /api/reviews/statistics
  async getReviewStatistics(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = req.query.doctorId ? parseInt(req.query.doctorId as string) : undefined;

      if (doctorId && isNaN(doctorId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid doctor ID',
        });
        return;
      }

      const result = await this.reviewService.getReviewStatistics(doctorId);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Get review statistics controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve review statistics. Please try again.',
      });
    }
  }

  // GET /api/reviews/doctor/:doctorId
  async getReviewsByDoctor(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = parseInt(req.params.doctorId);
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      if (isNaN(doctorId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid doctor ID',
        });
        return;
      }

      const result = await this.reviewService.getReviewsByDoctor(doctorId, page, limit);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Get reviews by doctor controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve doctor reviews. Please try again.',
      });
    }
  }

  // GET /api/reviews/patient/me
  async getMyReviews(req: Request, res: Response): Promise<void> {
    try {
      const patientId = (req as any).user?.userId;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const result = await this.reviewService.getReviewsByPatient(patientId, page, limit);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Get my reviews controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve your reviews. Please try again.',
      });
    }
  }
} 
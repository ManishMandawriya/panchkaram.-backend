import { Request, Response } from 'express';
import { DoctorService } from '../../services/doctorService';
import { logger } from '../../utils/logger';

export class DoctorController {
  private doctorService: DoctorService;

  constructor() {
    this.doctorService = new DoctorService();
  }

  // GET /api/doctors - Get all doctors
  async getDoctors(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
        specialty: req.query.specialty as string,
        search: req.query.search as string,
        rating: req.query.rating ? parseInt(req.query.rating as string) : undefined,
        experience: req.query.experience as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as 'id' | 'experience' | 'reviewsCount' | 'createdAt' || 'id',
        sortOrder: req.query.sortOrder as 'ASC' | 'DESC' || 'DESC',
      };

      const result = await this.doctorService.getDoctors(filters);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Get doctors controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve doctors. Please try again.',
      });
    }
  }

  // GET /api/doctors/:id - Get doctor by ID
  async getDoctorById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid doctor ID',
        });
        return;
      }

      const result = await this.doctorService.getDoctorById(id);
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error('Get doctor by ID controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve doctor. Please try again.',
      });
    }
  }

  // POST /api/doctors/search - Search doctors
  async searchDoctors(req: Request, res: Response): Promise<void> {
    try {
      const searchData = {
        search: req.body.search,
        categoryIds: req.body.categoryIds,
        specialty: req.body.specialty,
        page: req.body.page || 1,
        limit: req.body.limit || 10,
      };

      const result = await this.doctorService.searchDoctors(searchData);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Search doctors controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search doctors. Please try again.',
      });
    }
  }

  // GET /api/doctors/top - Get top doctors
  async getTopDoctors(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;

      const result = await this.doctorService.getTopDoctors(limit);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Get top doctors controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve top doctors. Please try again.',
      });
    }
  }
} 
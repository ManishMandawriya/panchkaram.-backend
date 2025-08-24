import { Request, Response } from 'express';
import { CategoryService } from '../../services/categoryService';
import { logger } from '../../utils/logger';

export class CategoryController {
  private categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  // GET /api/categories
  async getActiveCategories(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.categoryService.getActiveCategories();
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Get active categories controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve categories. Please try again.',
      });
    }
  }

  // GET /api/categories/:id
  async getCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid category ID',
        });
        return;
      }

      const result = await this.categoryService.getCategoryById(id);
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error('Get category by ID controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve category. Please try again.',
      });
    }
  }
} 
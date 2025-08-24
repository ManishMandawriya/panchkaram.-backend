import { Request, Response } from 'express';
import { ServiceService } from '../../services/serviceService';
import { logger } from '../../utils/logger';

export class ServiceController {
  private serviceService: ServiceService;

  constructor() {
    this.serviceService = new ServiceService();
  }

  // GET /api/services - Get all services
  async getServices(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.serviceService.getServices();
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Get services controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve services. Please try again.',
      });
    }
  }

  // GET /api/services/:id - Get service by ID
  async getServiceById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid service ID',
        });
        return;
      }

      const result = await this.serviceService.getServiceById(id);
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error('Get service by ID controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve service. Please try again.',
      });
    }
  }

  // GET /api/services/type/:type - Get service by type
  async getServiceByType(req: Request, res: Response): Promise<void> {
    try {
      const type = req.params.type;

      if (!type) {
        res.status(400).json({
          success: false,
          message: 'Service type is required',
        });
        return;
      }

      const result = await this.serviceService.getServiceByType(type as any);
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error('Get service by type controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve service. Please try again.',
      });
    }
  }

  // GET /api/services/prices - Get service prices
  async getServicePrices(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.serviceService.getServicePrices();
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Get service prices controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve service prices. Please try again.',
      });
    }
  }

  // POST /api/services/initialize - Initialize default services
  async initializeDefaultServices(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.serviceService.initializeDefaultServices();
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Initialize default services controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initialize default services. Please try again.',
      });
    }
  }
} 
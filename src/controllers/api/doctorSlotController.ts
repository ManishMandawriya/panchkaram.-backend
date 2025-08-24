import { Request, Response } from 'express';
import { DoctorSlotService } from '../../services/doctorSlotService';
import { logger } from '../../utils/logger';

export class DoctorSlotController {
  private doctorSlotService: DoctorSlotService;

  constructor() {
    this.doctorSlotService = new DoctorSlotService();
  }

  // GET /api/doctor/slots - Get doctor's time slots
  async getTimeSlots(req: Request, res: Response): Promise<void> {
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

      const result = await this.doctorSlotService.getTimeSlots(doctorId);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Get time slots controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve time slots. Please try again.',
      });
    }
  }

  // POST /api/doctor/slots - Create or update doctor's time slots
  async createOrUpdateTimeSlots(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const { weekSchedule } = req.body;

      if (!doctorId || userRole !== 'doctor') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Only doctors can access this endpoint.',
        });
        return;
      }

      const result = await this.doctorSlotService.createOrUpdateTimeSlots(doctorId, weekSchedule);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Create/Update time slots controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create/update time slots. Please try again.',
      });
    }
  }
}


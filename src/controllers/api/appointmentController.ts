import { Request, Response } from 'express';
import { AppointmentService } from '../../services/appointmentService';
import { logger } from '../../utils/logger';
import { CreateAppointmentRequest, AppointmentStatus } from '../../types/appointment';

export class AppointmentController {
  private appointmentService: AppointmentService;

  constructor() {
    this.appointmentService = new AppointmentService();
  }

  // POST /api/appointments - Create appointment
  async createAppointment(req: Request, res: Response): Promise<void> {
    try {
      const patientId = (req as any).user?.userId;
      const appointmentData: CreateAppointmentRequest = req.body;

      const result = await this.appointmentService.createAppointment(patientId, appointmentData);
      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      logger.error('Create appointment controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create appointment. Please try again.',
      });
    }
  }

  // GET /api/appointments - Get appointments
  async getAppointments(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        doctorId: req.query.doctorId ? parseInt(req.query.doctorId as string) : undefined,
        patientId: req.query.patientId ? parseInt(req.query.patientId as string) : undefined,
        status: req.query.status as AppointmentStatus,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as 'appointmentDate' | 'createdAt' || 'appointmentDate',
        sortOrder: req.query.sortOrder as 'ASC' | 'DESC' || 'ASC',
      };

      const result = await this.appointmentService.getAppointments(filters);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Get appointments controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve appointments. Please try again.',
      });
    }
  }

  // GET /api/appointments/:id - Get appointment by ID
  async getAppointmentById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid appointment ID',
        });
        return;
      }

      const result = await this.appointmentService.getAppointmentById(id);
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error('Get appointment by ID controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve appointment. Please try again.',
      });
    }
  }

  // GET /api/doctors/:doctorId/available-slots - Get available slots
  async getAvailableSlots(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = parseInt(req.params.doctorId);
      const date = req.query.date as string;
      const timeOfDay = req.query.timeOfDay as 'morning' | 'evening';

      if (isNaN(doctorId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid doctor ID',
        });
        return;
      }

      if (!date || !timeOfDay) {
        res.status(400).json({
          success: false,
          message: 'Date and timeOfDay are required',
        });
        return;
      }

      const result = await this.appointmentService.getAvailableSlots(doctorId, date, timeOfDay);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Get available slots controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve available slots. Please try again.',
      });
    }
  }

  // PUT /api/appointments/:id/status - Update appointment status
  async updateAppointmentStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const status = req.body.status as AppointmentStatus;

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid appointment ID',
        });
        return;
      }

      if (!status || !Object.values(AppointmentStatus).includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid appointment status',
        });
        return;
      }

      const result = await this.appointmentService.updateAppointmentStatus(id, status);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Update appointment status controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update appointment status. Please try again.',
      });
    }
  }

  // DELETE /api/appointments/:id - Cancel appointment
  async cancelAppointment(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const patientId = (req as any).user?.userId;

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid appointment ID',
        });
        return;
      }

      const result = await this.appointmentService.cancelAppointment(id, patientId);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Cancel appointment controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel appointment. Please try again.',
      });
    }
  }

  // GET /api/appointments/my - Get my appointments
  async getMyAppointments(req: Request, res: Response): Promise<void> {
    try {
      const patientId = (req as any).user?.userId;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const filter = req.query.filter as 'all' | 'past' | 'future' || 'all';

      const result = await this.appointmentService.getMyAppointments(patientId, page, limit, filter);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Get my appointments controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve your appointments. Please try again.',
      });
    }
  }
} 
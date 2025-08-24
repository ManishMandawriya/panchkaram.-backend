import { Request, Response } from 'express';
import { DoctorAppointmentService } from '../../services/doctorAppointmentService';
import { logger } from '../../utils/logger';
import { AppointmentStatus } from '../../types/appointment';

export class DoctorAppointmentController {
  private doctorAppointmentService: DoctorAppointmentService;

  constructor() {
    this.doctorAppointmentService = new DoctorAppointmentService();
  }

  // GET /api/doctor/appointments - Get doctor's appointments
  async getDoctorAppointments(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      if (!doctorId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (userRole !== 'doctor') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Only doctors can access this endpoint.',
        });
        return;
      }

      const filters = {
        status: req.query.status as AppointmentStatus,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as 'appointmentDate' | 'createdAt' | 'patientName' || 'appointmentDate',
        sortOrder: req.query.sortOrder as 'ASC' | 'DESC' || 'ASC',
      };

      const result = await this.doctorAppointmentService.getDoctorAppointments(doctorId, filters);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Get doctor appointments controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve appointments. Please try again.',
      });
    }
  }

  // GET /api/doctor/appointments/pending - Get pending appointments
  async getPendingAppointments(req: Request, res: Response): Promise<void> {
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

      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const result = await this.doctorAppointmentService.getPendingAppointments(doctorId, page, limit);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Get pending appointments controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve pending appointments. Please try again.',
      });
    }
  }

  // GET /api/doctor/appointments/upcoming - Get upcoming appointments
  async getUpcomingAppointments(req: Request, res: Response): Promise<void> {
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

      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const result = await this.doctorAppointmentService.getUpcomingAppointments(doctorId, page, limit);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Get upcoming appointments controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve upcoming appointments. Please try again.',
      });
    }
  }

  // GET /api/doctor/appointments/completed - Get completed appointments
  async getCompletedAppointments(req: Request, res: Response): Promise<void> {
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

      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const result = await this.doctorAppointmentService.getCompletedAppointments(doctorId, page, limit);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Get completed appointments controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve completed appointments. Please try again.',
      });
    }
  }

  // GET /api/doctor/appointments/:id - Get specific appointment details
  async getAppointmentById(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const appointmentId = parseInt(req.params.id);

      if (!doctorId || userRole !== 'doctor') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Only doctors can access this endpoint.',
        });
        return;
      }

      if (isNaN(appointmentId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid appointment ID',
        });
        return;
      }

      const result = await this.doctorAppointmentService.getAppointmentById(doctorId, appointmentId);
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error('Get appointment by ID controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve appointment. Please try again.',
      });
    }
  }

  // PUT /api/doctor/appointments/:id/status - Update appointment status
  async updateAppointmentStatus(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const appointmentId = parseInt(req.params.id);
      const { status } = req.body;

      if (!doctorId || userRole !== 'doctor') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Only doctors can access this endpoint.',
        });
        return;
      }

      if (isNaN(appointmentId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid appointment ID',
        });
        return;
      }

      const result = await this.doctorAppointmentService.updateAppointmentStatus(doctorId, appointmentId, status);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Update appointment status controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update appointment status. Please try again.',
      });
    }
  }

  // PUT /api/doctor/appointments/:id/accept - Accept appointment
  async acceptAppointment(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const appointmentId = parseInt(req.params.id);

      if (!doctorId || userRole !== 'doctor') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Only doctors can access this endpoint.',
        });
        return;
      }

      if (isNaN(appointmentId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid appointment ID',
        });
        return;
      }

      const result = await this.doctorAppointmentService.acceptAppointment(doctorId, appointmentId);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Accept appointment controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to accept appointment. Please try again.',
      });
    }
  }

  // PUT /api/doctor/appointments/:id/reject - Reject appointment
  async rejectAppointment(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const appointmentId = parseInt(req.params.id);

      if (!doctorId || userRole !== 'doctor') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Only doctors can access this endpoint.',
        });
        return;
      }

      if (isNaN(appointmentId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid appointment ID',
        });
        return;
      }

      const result = await this.doctorAppointmentService.rejectAppointment(doctorId, appointmentId);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Reject appointment controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject appointment. Please try again.',
      });
    }
  }

  // PUT /api/doctor/appointments/:id/complete - Mark appointment as complete
  async completeAppointment(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const appointmentId = parseInt(req.params.id);

      if (!doctorId || userRole !== 'doctor') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Only doctors can access this endpoint.',
        });
        return;
      }

      if (isNaN(appointmentId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid appointment ID',
        });
        return;
      }

      const result = await this.doctorAppointmentService.completeAppointment(doctorId, appointmentId);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Complete appointment controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete appointment. Please try again.',
      });
    }
  }

  // GET /api/doctor/appointments/stats/overview - Get appointment statistics
  async getAppointmentStats(req: Request, res: Response): Promise<void> {
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

      const result = await this.doctorAppointmentService.getAppointmentStats(doctorId);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Get appointment stats controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve appointment statistics. Please try again.',
      });
    }
  }
}

import { Router } from 'express';
import { DoctorAppointmentController } from '../../controllers/api/doctorAppointmentController';
import { authMiddleware } from '../../middleware/authMiddleware';
import { validateRequest } from '../../middleware/validateRequest';
import { updateAppointmentStatusSchema } from '../../validations/doctorAppointmentValidation';

const router = Router();
const doctorAppointmentController = new DoctorAppointmentController();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// GET /api/doctor/appointments - Get doctor's appointments
router.get('/', doctorAppointmentController.getDoctorAppointments.bind(doctorAppointmentController));

// GET /api/doctor/appointments/pending - Get pending appointments
router.get('/pending', doctorAppointmentController.getPendingAppointments.bind(doctorAppointmentController));

// GET /api/doctor/appointments/upcoming - Get upcoming appointments
router.get('/upcoming', doctorAppointmentController.getUpcomingAppointments.bind(doctorAppointmentController));

// GET /api/doctor/appointments/completed - Get completed appointments
router.get('/completed', doctorAppointmentController.getCompletedAppointments.bind(doctorAppointmentController));

// GET /api/doctor/appointments/:id - Get specific appointment details
router.get('/:id', doctorAppointmentController.getAppointmentById.bind(doctorAppointmentController));

// PUT /api/doctor/appointments/:id/status - Update appointment status
router.put('/:id/status', 
  validateRequest(updateAppointmentStatusSchema), 
  doctorAppointmentController.updateAppointmentStatus.bind(doctorAppointmentController)
);

// PUT /api/doctor/appointments/:id/accept - Accept appointment
router.put('/:id/accept', doctorAppointmentController.acceptAppointment.bind(doctorAppointmentController));

// PUT /api/doctor/appointments/:id/reject - Reject appointment
router.put('/:id/reject', doctorAppointmentController.rejectAppointment.bind(doctorAppointmentController));

// PUT /api/doctor/appointments/:id/complete - Mark appointment as complete
router.put('/:id/complete', doctorAppointmentController.completeAppointment.bind(doctorAppointmentController));

// GET /api/doctor/appointments/stats - Get appointment statistics
router.get('/stats/overview', doctorAppointmentController.getAppointmentStats.bind(doctorAppointmentController));

export default router;

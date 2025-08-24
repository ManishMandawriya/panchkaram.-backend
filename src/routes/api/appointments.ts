import { Router } from 'express';
import { AppointmentController } from '../../controllers/api/appointmentController';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();
const appointmentController = new AppointmentController();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// POST /api/appointments - Create appointment
router.post('/', appointmentController.createAppointment.bind(appointmentController));

// GET /api/appointments - Get appointments
router.get('/', appointmentController.getAppointments.bind(appointmentController));

// GET /api/appointments/my - Get my appointments
router.get('/my', appointmentController.getMyAppointments.bind(appointmentController));

// GET /api/appointments/:id - Get appointment by ID
router.get('/:id', appointmentController.getAppointmentById.bind(appointmentController));

// PUT /api/appointments/:id/status - Update appointment status
router.put('/:id/status', appointmentController.updateAppointmentStatus.bind(appointmentController));

// DELETE /api/appointments/:id - Cancel appointment
router.delete('/:id', appointmentController.cancelAppointment.bind(appointmentController));

// GET /api/doctors/:doctorId/available-slots - Get available slots
router.get('/doctors/:doctorId/available-slots', appointmentController.getAvailableSlots.bind(appointmentController));

export default router; 
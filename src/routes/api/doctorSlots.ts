import { Router } from 'express';
import { DoctorSlotController } from '../../controllers/api/doctorSlotController';
import { authMiddleware } from '../../middleware/authMiddleware';
import { validateRequest } from '../../middleware/validateRequest';
import { weekScheduleSchema } from '../../validations/doctorSlotValidation';

const router = Router();
const doctorSlotController = new DoctorSlotController();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/doctor/slots - Get doctor's time slots
router.get('/', doctorSlotController.getTimeSlots.bind(doctorSlotController));

// POST /api/doctor/slots - Create or update doctor's time slots
router.post('/', 
  validateRequest(weekScheduleSchema), 
  doctorSlotController.createOrUpdateTimeSlots.bind(doctorSlotController)
);

export default router;


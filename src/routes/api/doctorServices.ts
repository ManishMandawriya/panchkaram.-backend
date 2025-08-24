import { Router } from 'express';
import { DoctorServiceController } from '../../controllers/api/doctorServiceController';
import { authMiddleware } from '../../middleware/authMiddleware';
import { validateRequest } from '../../middleware/validateRequest';
import {
  updateDoctorServicesSchema,
  updateDoctorAvailabilitySchema,
  doctorIdParamSchema,
} from '../../validations/doctorServiceValidation';

const router = Router();

// Get doctor services and pricing
router.get('/:doctorId/services', DoctorServiceController.getDoctorServices);

// Update doctor services and pricing (protected)
router.put(
  '/:doctorId/services',
  authMiddleware,
  validateRequest(updateDoctorServicesSchema, 'body'),
  validateRequest(doctorIdParamSchema, 'params'),
  DoctorServiceController.updateDoctorServices
);

// Get doctor availability
router.get('/:doctorId/availability', DoctorServiceController.getDoctorAvailability);

// Update doctor availability (protected)
router.put(
  '/:doctorId/availability',
  authMiddleware,
  validateRequest(updateDoctorAvailabilitySchema, 'body'),
  validateRequest(doctorIdParamSchema, 'params'),
  DoctorServiceController.updateDoctorAvailability
);

// Get doctor profile with services and availability (public for users)
router.get('/:doctorId/profile', DoctorServiceController.getDoctorProfile);

// Update doctor degrees (protected)
router.put('/:doctorId/degrees', authMiddleware, DoctorServiceController.updateDegrees);

// Update doctor specializations (protected)
router.put('/:doctorId/specializations', authMiddleware, DoctorServiceController.updateSpecializations);

// Initialize default services and availability for a doctor (protected)
router.post('/:doctorId/initialize', authMiddleware, DoctorServiceController.initializeDoctorServices);

export default router;
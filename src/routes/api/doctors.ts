import { Router } from 'express';
import { DoctorController } from '../../controllers/api/doctorController';

const router = Router();
const doctorController = new DoctorController();

// GET /api/doctors - Get all doctors
router.get('/', doctorController.getDoctors.bind(doctorController));

// GET /api/doctors/top - Get top doctors
router.get('/top', doctorController.getTopDoctors.bind(doctorController));

// POST /api/doctors/search - Search doctors
router.post('/search', doctorController.searchDoctors.bind(doctorController));

// GET /api/doctors/:id - Get doctor by ID
router.get('/:id', doctorController.getDoctorById.bind(doctorController));

export default router; 
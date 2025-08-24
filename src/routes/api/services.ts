import { Router } from 'express';
import { ServiceController } from '../../controllers/api/serviceController';

const router = Router();
const serviceController = new ServiceController();

// GET /api/services - Get all services
router.get('/', serviceController.getServices.bind(serviceController));

// GET /api/services/prices - Get service prices
router.get('/prices', serviceController.getServicePrices.bind(serviceController));

// GET /api/services/:id - Get service by ID
router.get('/:id', serviceController.getServiceById.bind(serviceController));

// GET /api/services/type/:type - Get service by type
router.get('/type/:type', serviceController.getServiceByType.bind(serviceController));

// POST /api/services/initialize - Initialize default services
router.post('/initialize', serviceController.initializeDefaultServices.bind(serviceController));

export default router; 
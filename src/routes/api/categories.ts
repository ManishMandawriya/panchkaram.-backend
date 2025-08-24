import { Router } from 'express';
import { CategoryController } from '../../controllers/api/categoryController';

const router = Router();
const categoryController = new CategoryController();

// Get active categories (public)
router.get('/', categoryController.getActiveCategories.bind(categoryController));

// Get category by ID (public)
router.get('/:id', categoryController.getCategoryById.bind(categoryController));

export default router; 
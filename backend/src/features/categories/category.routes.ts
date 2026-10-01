import { Router } from 'express';
import { categoryController } from './category.controller';
import { asyncHandler } from '@/utils/asyncHandler';

/**
 * Category routes - wiring only (path + middleware + controller).
 * No business logic here.
 */
const router = Router();

router.get('/status', asyncHandler(categoryController.status));

export const categoryRoutes = router;

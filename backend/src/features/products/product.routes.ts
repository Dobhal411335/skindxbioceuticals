import { Router } from 'express';
import { productController } from './product.controller';
import { asyncHandler } from '@/utils/asyncHandler';

/**
 * Product routes - wiring only (path + middleware + controller).
 * No business logic here.
 */
const router = Router();

router.get('/status', asyncHandler(productController.status));

export const productRoutes = router;

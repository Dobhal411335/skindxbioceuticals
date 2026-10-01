import { Router } from 'express';
import { orderController } from './order.controller';
import { asyncHandler } from '@/utils/asyncHandler';

/**
 * Order routes - wiring only (path + middleware + controller).
 * No business logic here.
 */
const router = Router();

router.get('/status', asyncHandler(orderController.status));

export const orderRoutes = router;

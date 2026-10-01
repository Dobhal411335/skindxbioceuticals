import { Router } from 'express';
import { shippingController } from './shipping.controller';
import { asyncHandler } from '@/utils/asyncHandler';

/**
 * Shipping routes - wiring only (path + middleware + controller).
 * No business logic here.
 */
const router = Router();

router.get('/status', asyncHandler(shippingController.status));

export const shippingRoutes = router;

import { Router } from 'express';
import { couponController } from './coupon.controller';
import { asyncHandler } from '@/utils/asyncHandler';

/**
 * Coupon routes - wiring only (path + middleware + controller).
 * No business logic here.
 */
const router = Router();

router.get('/status', asyncHandler(couponController.status));

export const couponRoutes = router;

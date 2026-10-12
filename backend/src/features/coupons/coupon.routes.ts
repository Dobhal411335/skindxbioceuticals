import { Router } from 'express';
import { couponController } from './coupon.controller';
import { asyncHandler } from '@/utils/asyncHandler';

/**
 * Public/scaffold coupon routes - wiring only.
 * Admin CRUD is mounted under `/admin/sites/:siteCode/coupons`.
 */
const router = Router();

router.get('/status', asyncHandler(couponController.status));

export const couponRoutes = router;

import { Router } from 'express';
import { paymentController } from './payment.controller';
import { asyncHandler } from '@/utils/asyncHandler';

/**
 * Payment routes - wiring only (path + middleware + controller).
 * No business logic here.
 */
const router = Router();

router.get('/status', asyncHandler(paymentController.status));

export const paymentRoutes = router;

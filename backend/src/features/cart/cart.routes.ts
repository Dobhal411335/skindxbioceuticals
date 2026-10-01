import { Router } from 'express';
import { cartController } from './cart.controller';
import { asyncHandler } from '@/utils/asyncHandler';

/**
 * Cart routes - wiring only (path + middleware + controller).
 * No business logic here.
 */
const router = Router();

router.get('/status', asyncHandler(cartController.status));

export const cartRoutes = router;

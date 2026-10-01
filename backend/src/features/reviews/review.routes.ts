import { Router } from 'express';
import { reviewController } from './review.controller';
import { asyncHandler } from '@/utils/asyncHandler';

/**
 * Review routes - wiring only (path + middleware + controller).
 * No business logic here.
 */
const router = Router();

router.get('/status', asyncHandler(reviewController.status));

export const reviewRoutes = router;

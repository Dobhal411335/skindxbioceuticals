import { Router } from 'express';
import { mediaController } from './media.controller';
import { asyncHandler } from '@/utils/asyncHandler';

/**
 * Media routes - wiring only (path + middleware + controller).
 * No business logic here.
 */
const router = Router();

router.get('/status', asyncHandler(mediaController.status));

export const mediaRoutes = router;

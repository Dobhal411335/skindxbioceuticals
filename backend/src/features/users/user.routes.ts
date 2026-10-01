import { Router } from 'express';
import { userController } from './user.controller';
import { asyncHandler } from '@/utils/asyncHandler';

/**
 * User routes - wiring only (path + middleware + controller).
 * No business logic here.
 */
const router = Router();

router.get('/status', asyncHandler(userController.status));

export const userRoutes = router;

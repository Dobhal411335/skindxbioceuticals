import { Router } from 'express';
import { settingsController } from './settings.controller';
import { asyncHandler } from '@/utils/asyncHandler';

/**
 * Settings routes - wiring only (path + middleware + controller).
 * No business logic here.
 */
const router = Router();

router.get('/status', asyncHandler(settingsController.status));

export const settingsRoutes = router;

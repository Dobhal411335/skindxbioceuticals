import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import { asyncHandler } from '@/utils/asyncHandler';

/**
 * Inventory routes - wiring only (path + middleware + controller).
 * No business logic here.
 */
const router = Router();

router.get('/status', asyncHandler(inventoryController.status));

export const inventoryRoutes = router;

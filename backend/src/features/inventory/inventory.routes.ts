import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import { asyncHandler } from '@/utils/asyncHandler';

/**
 * Inventory routes - wiring only (path + middleware + controller).
 * No business logic here.
 */
const router = Router();

/** Public / scaffold mount — admin stock APIs live under `/admin/sites/:siteCode/stock`. */
router.get('/status', asyncHandler(inventoryController.status));

export const inventoryRoutes = router;

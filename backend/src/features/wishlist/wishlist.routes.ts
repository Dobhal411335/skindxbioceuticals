import { Router } from 'express';
import { wishlistController } from './wishlist.controller';
import { asyncHandler } from '@/utils/asyncHandler';

/**
 * Wishlist routes - wiring only (path + middleware + controller).
 * No business logic here.
 */
const router = Router();

router.get('/status', asyncHandler(wishlistController.status));

export const wishlistRoutes = router;

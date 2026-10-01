import { Router } from 'express';
import { blogController } from './blog.controller';
import { asyncHandler } from '@/utils/asyncHandler';

/**
 * Blog routes - wiring only (path + middleware + controller).
 * No business logic here.
 */
const router = Router();

router.get('/status', asyncHandler(blogController.status));

export const blogRoutes = router;

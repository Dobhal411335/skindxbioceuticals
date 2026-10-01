import { Router } from 'express';
import { adminController } from './admin.controller';
import { asyncHandler } from '@/utils/asyncHandler';
import { authenticate, authorize } from '@/middlewares/auth.middleware';

/**
 * Admin routes - wiring only.
 * Protected by JWT auth + ADMIN / SUPER_ADMIN roles (when endpoints are implemented).
 */
const router = Router();

router.get('/status', asyncHandler(adminController.status));

// Example RBAC gate for future admin dashboard routes
router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

export const adminRoutes = router;

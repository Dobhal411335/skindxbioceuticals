import { Router } from 'express';
import { authController } from './auth.controller';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { loginSchema, registerSchema, refreshTokenSchema } from './auth.validation';

/**
 * Auth routes - wiring only (path + middleware + controller).
 * No business logic here.
 *
 * Planned endpoints (not implemented yet):
 * - POST /register
 * - POST /login
 * - POST /refresh
 * - POST /logout
 * - POST /admin/login
 */
const router = Router();

router.get('/status', asyncHandler(authController.status));

// Scaffolded route shapes - handlers remain placeholders until business logic is added
router.post(
  '/register',
  validate({ body: registerSchema }),
  asyncHandler(authController.status),
);

router.post('/login', validate({ body: loginSchema }), asyncHandler(authController.status));

router.post(
  '/refresh',
  validate({ body: refreshTokenSchema }),
  asyncHandler(authController.status),
);

export const authRoutes = router;

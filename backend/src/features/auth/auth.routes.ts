import { Router } from 'express';
import { authController } from './auth.controller';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { requireAllowedAuthOrigin } from '@/middlewares/auth-origin.middleware';
import {
  changePasswordRateLimiter,
  loginRateLimiter,
  refreshRateLimiter,
  registerRateLimiter,
  resendVerificationRateLimiter,
  verifyEmailRateLimiter,
} from '@/middlewares/rate-limit.middleware';
import {
  adminLoginSchema,
  bootstrapAdminSchema,
  changePasswordSchema,
  googleAuthSchema,
  loginSchema,
  logoutSchema,
  registerSchema,
  resendVerificationSchema,
  verifyEmailSchema,
} from './auth.validation';

/**
 * Auth routes - wiring only (path + middleware + controller).
 * No business logic here.
 */
const router = Router();

router.get('/status', asyncHandler(authController.status));

router.post(
  '/bootstrap-admin',
  validate({ body: bootstrapAdminSchema }),
  asyncHandler(authController.bootstrapAdmin),
);

router.post(
  '/admin/login',
  validate({ body: adminLoginSchema }),
  asyncHandler(authController.adminLogin),
);

router.post(
  '/register',
  registerRateLimiter,
  validate({ body: registerSchema }),
  asyncHandler(authController.register),
);

router.post(
  '/verify-email',
  verifyEmailRateLimiter,
  validate({ body: verifyEmailSchema }),
  asyncHandler(authController.verifyEmail),
);

router.post(
  '/resend-verification',
  resendVerificationRateLimiter,
  validate({ body: resendVerificationSchema }),
  asyncHandler(authController.resendVerification),
);

router.post(
  '/login',
  loginRateLimiter,
  validate({ body: loginSchema }),
  asyncHandler(authController.login),
);

router.post(
  '/google',
  validate({ body: googleAuthSchema }),
  asyncHandler(authController.googleAuth),
);

router.post(
  '/refresh',
  refreshRateLimiter,
  requireAllowedAuthOrigin,
  asyncHandler(authController.refresh),
);

router.post(
  '/logout',
  requireAllowedAuthOrigin,
  validate({ body: logoutSchema }),
  asyncHandler(authController.logout),
);

router.get('/me', authenticate, asyncHandler(authController.me));

router.patch(
  '/password',
  authenticate,
  changePasswordRateLimiter,
  validate({ body: changePasswordSchema }),
  asyncHandler(authController.changePassword),
);

export const authRoutes = router;

import { Router } from 'express';
import { createRateLimiter } from '@/middlewares/rate-limit.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { asyncHandler } from '@/utils/asyncHandler';
import { guestCheckoutController } from './guest-checkout.controller';
import {
  guestSendOtpBodySchema,
  guestSessionBodySchema,
  guestVerifyOtpBodySchema,
} from './guest-checkout.validation';

const guestSessionRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyPrefix: 'guest-session',
});

const guestOtpSendRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: 'guest-otp-send',
});

const guestOtpVerifyRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyPrefix: 'guest-otp-verify',
});

const router = Router();

router.post(
  '/session',
  guestSessionRateLimiter,
  validate({ body: guestSessionBodySchema }),
  asyncHandler(guestCheckoutController.startSession),
);

router.post(
  '/send-otp',
  guestOtpSendRateLimiter,
  validate({ body: guestSendOtpBodySchema }),
  asyncHandler(guestCheckoutController.sendOtp),
);

router.post(
  '/verify-otp',
  guestOtpVerifyRateLimiter,
  validate({ body: guestVerifyOtpBodySchema }),
  asyncHandler(guestCheckoutController.verifyOtp),
);

export const guestCheckoutRoutes = router;

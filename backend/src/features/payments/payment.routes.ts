import { Router } from 'express';
import { optionalAuthenticate } from '@/middlewares/auth.middleware';
import { createRateLimiter } from '@/middlewares/rate-limit.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { asyncHandler } from '@/utils/asyncHandler';
import { paymentController } from './payment.controller';
import {
  createPaymentOrderBodySchema,
  orderConfirmationQuerySchema,
  paymentStatusParamsSchema,
  paymentStatusQuerySchema,
  verifyPaymentBodySchema,
} from './payment.validation';

const createOrderRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  keyPrefix: 'payment-create',
});

const verifyRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  keyPrefix: 'payment-verify',
});

const router = Router();

router.post(
  '/create-order',
  createOrderRateLimiter,
  optionalAuthenticate,
  validate({ body: createPaymentOrderBodySchema }),
  asyncHandler(paymentController.createOrder),
);

router.post(
  '/verify',
  verifyRateLimiter,
  optionalAuthenticate,
  validate({ body: verifyPaymentBodySchema }),
  asyncHandler(paymentController.verify),
);

router.get(
  '/status/:orderId',
  optionalAuthenticate,
  validate({ params: paymentStatusParamsSchema, query: paymentStatusQuerySchema }),
  asyncHandler(paymentController.status),
);

router.get(
  '/confirmation',
  optionalAuthenticate,
  validate({ query: orderConfirmationQuerySchema }),
  asyncHandler(paymentController.confirmation),
);

export const paymentRoutes = router;

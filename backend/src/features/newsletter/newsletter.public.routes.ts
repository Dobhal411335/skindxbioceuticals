import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { newsletterController } from './newsletter.controller';
import {
  newsletterSubscribeBodySchema,
  newsletterUnsubscribeQuerySchema,
  optionalSiteCodeParamSchema,
} from './newsletter.validation';

export const newsletterPublicRoutes = Router({ mergeParams: true });

newsletterPublicRoutes.post(
  '/subscribe',
  validate({ params: optionalSiteCodeParamSchema, body: newsletterSubscribeBodySchema }),
  asyncHandler(newsletterController.subscribe),
);

newsletterPublicRoutes.post(
  '/',
  validate({ params: optionalSiteCodeParamSchema, body: newsletterSubscribeBodySchema }),
  asyncHandler(newsletterController.subscribe),
);

newsletterPublicRoutes.get(
  '/unsubscribe',
  validate({ query: newsletterUnsubscribeQuerySchema }),
  asyncHandler(newsletterController.unsubscribe),
);

newsletterPublicRoutes.post(
  '/unsubscribe',
  asyncHandler(newsletterController.unsubscribe),
);

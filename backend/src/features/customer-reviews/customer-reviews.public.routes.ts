import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { customerReviewsController } from './customer-reviews.controller';

/**
 * Public storefront routes — no authentication.
 * Mounted at `/sites/:siteCode/customer-reviews`.
 */
export const customerReviewsPublicRoutes = Router({ mergeParams: true });

customerReviewsPublicRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  asyncHandler(customerReviewsController.listPublic),
);

import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { customerReviewsController } from './customer-reviews.controller';
import {
  customerReviewBodySchema,
  customerReviewIdParamSchema,
  customerReviewPatchSchema,
  normalizeCustomerReviewInput,
} from './customer-reviews.validation';

/**
 * Mounted under `/admin` after authenticate + ADMIN/SUPER_ADMIN authorize.
 */
export const customerReviewsRoutes = Router({ mergeParams: true });

customerReviewsRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(customerReviewsController.list),
);

customerReviewsRoutes.post(
  '/',
  (req, _res, next) => {
    req.body = normalizeCustomerReviewInput(req.body);
    next();
  },
  validate({ params: siteCodeParamSchema, body: customerReviewBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(customerReviewsController.create),
);

customerReviewsRoutes.put(
  '/:reviewId',
  (req, _res, next) => {
    req.body = normalizeCustomerReviewInput(req.body);
    next();
  },
  validate({ params: customerReviewIdParamSchema, body: customerReviewBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(customerReviewsController.update),
);

customerReviewsRoutes.patch(
  '/:reviewId',
  validate({ params: customerReviewIdParamSchema, body: customerReviewPatchSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(customerReviewsController.patch),
);

customerReviewsRoutes.delete(
  '/:reviewId',
  validate({ params: customerReviewIdParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(customerReviewsController.remove),
);

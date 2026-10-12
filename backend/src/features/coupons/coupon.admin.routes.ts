import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { couponController } from './coupon.controller';
import {
  couponBodySchema,
  couponIdParamSchema,
  couponPatchSchema,
  normalizeCouponInput,
} from './coupon.validation';

/**
 * Mounted under `/admin` after authenticate + ADMIN/SUPER_ADMIN authorize.
 * Path: `/admin/sites/:siteCode/coupons`
 */
export const couponAdminRoutes = Router({ mergeParams: true });

couponAdminRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(couponController.list),
);

couponAdminRoutes.post(
  '/',
  (req, _res, next) => {
    req.body = normalizeCouponInput(req.body);
    next();
  },
  validate({ params: siteCodeParamSchema, body: couponBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(couponController.create),
);

couponAdminRoutes.put(
  '/:couponId',
  (req, _res, next) => {
    req.body = normalizeCouponInput(req.body);
    next();
  },
  validate({ params: couponIdParamSchema, body: couponBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(couponController.update),
);

couponAdminRoutes.patch(
  '/:couponId',
  validate({ params: couponIdParamSchema, body: couponPatchSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(couponController.patch),
);

couponAdminRoutes.delete(
  '/:couponId',
  validate({ params: couponIdParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(couponController.remove),
);

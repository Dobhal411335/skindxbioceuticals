import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { promoBannerController } from './promo-banner.controller';
import {
  normalizePromoBannerConfigInput,
  promoBannerConfigBodySchema,
} from './promo-banner.validation';

/**
 * Admin promo banner routes.
 * Mounted at `/admin/sites/:siteCode/promo-banners`.
 * Parent router already applies authenticate + authorize(ADMIN, SUPER_ADMIN).
 */
export const promoBannerRoutes = Router({ mergeParams: true });

promoBannerRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(promoBannerController.get),
);

promoBannerRoutes.put(
  '/',
  (req, _res, next) => {
    req.body = normalizePromoBannerConfigInput(req.body);
    next();
  },
  validate({
    params: siteCodeParamSchema,
    body: promoBannerConfigBodySchema,
  }),
  requireSiteAccess('siteCode'),
  asyncHandler(promoBannerController.upsert),
);

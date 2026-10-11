import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { aboutUsBannerController } from './about-us-banner.controller';
import {
  aboutUsBannerConfigBodySchema,
  normalizeAboutUsBannerConfigInput,
} from './about-us-banner.validation';

/**
 * Admin About Us banner routes.
 * Mounted at `/admin/sites/:siteCode/about-us-banner`.
 * Parent router already applies authenticate + authorize(ADMIN, SUPER_ADMIN).
 */
export const aboutUsBannerRoutes = Router({ mergeParams: true });

aboutUsBannerRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(aboutUsBannerController.get),
);

aboutUsBannerRoutes.put(
  '/',
  (req, _res, next) => {
    req.body = normalizeAboutUsBannerConfigInput(req.body);
    next();
  },
  validate({
    params: siteCodeParamSchema,
    body: aboutUsBannerConfigBodySchema,
  }),
  requireSiteAccess('siteCode'),
  asyncHandler(aboutUsBannerController.upsert),
);

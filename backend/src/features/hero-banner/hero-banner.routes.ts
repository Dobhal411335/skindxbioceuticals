import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { heroBannerController } from './hero-banner.controller';
import {
  heroBannerConfigBodySchema,
  normalizeHeroBannerConfigInput,
} from './hero-banner.validation';

/**
 * Mounted under `/admin` after authenticate + ADMIN/SUPER_ADMIN authorize.
 */
export const heroBannerRoutes = Router({ mergeParams: true });

heroBannerRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(heroBannerController.get),
);

heroBannerRoutes.put(
  '/',
  (req, _res, next) => {
    req.body = normalizeHeroBannerConfigInput(req.body);
    next();
  },
  validate({ params: siteCodeParamSchema, body: heroBannerConfigBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(heroBannerController.upsert),
);

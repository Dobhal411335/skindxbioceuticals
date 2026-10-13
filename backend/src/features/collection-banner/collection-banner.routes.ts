import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { collectionBannerController } from './collection-banner.controller';
import {
  collectionBannerConfigBodySchema,
  normalizeCollectionBannerConfigInput,
} from './collection-banner.validation';

/**
 * Admin collection banner routes.
 * Mounted at `/admin/sites/:siteCode/collection-banners`.
 * Parent router already applies authenticate + authorize(ADMIN, SUPER_ADMIN).
 */
export const collectionBannerRoutes = Router({ mergeParams: true });

collectionBannerRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(collectionBannerController.get),
);

collectionBannerRoutes.put(
  '/',
  (req, _res, next) => {
    req.body = normalizeCollectionBannerConfigInput(req.body);
    next();
  },
  validate({
    params: siteCodeParamSchema,
    body: collectionBannerConfigBodySchema,
  }),
  requireSiteAccess('siteCode'),
  asyncHandler(collectionBannerController.upsert),
);

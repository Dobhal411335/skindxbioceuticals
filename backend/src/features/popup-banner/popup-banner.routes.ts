import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { popupBannerController } from './popup-banner.controller';
import {
  normalizePopupBannerConfigInput,
  popupBannerConfigBodySchema,
} from './popup-banner.validation';

/**
 * Mounted under `/admin` after authenticate + ADMIN/SUPER_ADMIN authorize.
 */
export const popupBannerRoutes = Router({ mergeParams: true });

popupBannerRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(popupBannerController.get),
);

popupBannerRoutes.put(
  '/',
  (req, _res, next) => {
    req.body = normalizePopupBannerConfigInput(req.body);
    next();
  },
  validate({
    params: siteCodeParamSchema,
    body: popupBannerConfigBodySchema,
  }),
  requireSiteAccess('siteCode'),
  asyncHandler(popupBannerController.upsert),
);

import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { popupBannerController } from './popup-banner.controller';

/**
 * Public popup banner routes.
 * Mounted at `/sites/:siteCode/popup-banner`.
 */
export const popupBannerPublicRoutes = Router({ mergeParams: true });

popupBannerPublicRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  asyncHandler(popupBannerController.getPublic),
);

import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { promoBannerController } from './promo-banner.controller';

/**
 * Public promo banner routes.
 * Mounted at `/sites/:siteCode/promo-banners`.
 */
export const promoBannerPublicRoutes = Router({ mergeParams: true });

promoBannerPublicRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  asyncHandler(promoBannerController.getPublic),
);

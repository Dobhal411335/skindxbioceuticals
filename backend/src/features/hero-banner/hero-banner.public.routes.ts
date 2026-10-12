import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { heroBannerController } from './hero-banner.controller';

/**
 * Mounted at `/sites/:siteCode/hero-banners`.
 */
export const heroBannerPublicRoutes = Router({ mergeParams: true });

heroBannerPublicRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  asyncHandler(heroBannerController.getPublic),
);

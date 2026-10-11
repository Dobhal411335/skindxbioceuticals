import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { aboutUsBannerController } from './about-us-banner.controller';

/**
 * Public About Us banner routes.
 * Mounted at `/sites/:siteCode/about-us-banner`.
 */
export const aboutUsBannerPublicRoutes = Router({ mergeParams: true });

aboutUsBannerPublicRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  asyncHandler(aboutUsBannerController.getPublic),
);

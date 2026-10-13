import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { collectionBannerController } from './collection-banner.controller';

/**
 * Public collection banner routes.
 * Mounted at `/sites/:siteCode/collection-banners`.
 */
export const collectionBannerPublicRoutes = Router({ mergeParams: true });

collectionBannerPublicRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  asyncHandler(collectionBannerController.getPublic),
);

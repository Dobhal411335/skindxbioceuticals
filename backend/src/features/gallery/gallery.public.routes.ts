import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { galleryController } from './gallery.controller';

/**
 * Public storefront routes — no authentication.
 * Mounted at `/sites/:siteCode/gallery`.
 */
export const galleryPublicRoutes = Router({ mergeParams: true });

galleryPublicRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  asyncHandler(galleryController.listPublic),
);

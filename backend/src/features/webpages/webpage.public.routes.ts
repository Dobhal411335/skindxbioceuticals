import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { webpageController } from './webpage.controller';
import { webpageSlugParamSchema } from './webpage.validation';

/**
 * Public storefront routes — no authentication.
 * Mounted at `/sites/:siteCode/webpages`.
 */
export const webpagePublicRoutes = Router({ mergeParams: true });

webpagePublicRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  asyncHandler(webpageController.listPublic),
);

webpagePublicRoutes.get(
  '/by-slug/:slug',
  validate({ params: webpageSlugParamSchema }),
  asyncHandler(webpageController.getPublicBySlug),
);

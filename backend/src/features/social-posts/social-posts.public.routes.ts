import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { socialPostsController } from './social-posts.controller';

/**
 * Public storefront routes — no authentication.
 * Mounted at `/sites/:siteCode/social-posts`.
 */
export const socialPostsPublicRoutes = Router({ mergeParams: true });

socialPostsPublicRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  asyncHandler(socialPostsController.listPublic),
);

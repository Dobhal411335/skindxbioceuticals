import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { blogController } from './blog.controller';
import { blogPublicListQuerySchema, blogSlugParamSchema } from './blog.validation';

/**
 * Public storefront routes — no authentication.
 * Mounted at `/sites/:siteCode/blogs`.
 */
export const blogPublicRoutes = Router({ mergeParams: true });

blogPublicRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema, query: blogPublicListQuerySchema }),
  asyncHandler(blogController.listPublic),
);

blogPublicRoutes.get(
  '/:slug',
  validate({ params: blogSlugParamSchema }),
  asyncHandler(blogController.getPublicBySlug),
);

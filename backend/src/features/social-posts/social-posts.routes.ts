import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { socialPostsController } from './social-posts.controller';
import {
  normalizeSocialPostInput,
  socialPostBodySchema,
  socialPostIdParamSchema,
  socialPostListQuerySchema,
  socialPostPatchSchema,
} from './social-posts.validation';

/**
 * Mounted under `/admin` after authenticate + ADMIN/SUPER_ADMIN authorize.
 */
export const socialPostsRoutes = Router({ mergeParams: true });

socialPostsRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema, query: socialPostListQuerySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(socialPostsController.list),
);

socialPostsRoutes.post(
  '/',
  (req, _res, next) => {
    req.body = normalizeSocialPostInput(req.body);
    next();
  },
  validate({ params: siteCodeParamSchema, body: socialPostBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(socialPostsController.create),
);

socialPostsRoutes.put(
  '/:postId',
  (req, _res, next) => {
    req.body = normalizeSocialPostInput(req.body);
    next();
  },
  validate({ params: socialPostIdParamSchema, body: socialPostBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(socialPostsController.update),
);

socialPostsRoutes.patch(
  '/:postId',
  validate({ params: socialPostIdParamSchema, body: socialPostPatchSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(socialPostsController.patch),
);

socialPostsRoutes.delete(
  '/:postId',
  validate({ params: socialPostIdParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(socialPostsController.remove),
);

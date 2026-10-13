import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { blogController } from './blog.controller';
import {
  blogAdminListQuerySchema,
  blogCreateBodySchema,
  blogIdParamSchema,
  blogPatchBodySchema,
  blogUpdateBodySchema,
  normalizeBlogCreateInput,
  normalizeBlogUpdateInput,
} from './blog.validation';

/**
 * Mounted under `/admin` after authenticate + ADMIN/SUPER_ADMIN authorize.
 * Base path: `/sites/:siteCode/blogs`
 */
export const blogAdminRoutes = Router({ mergeParams: true });

blogAdminRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema, query: blogAdminListQuerySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(blogController.list),
);

blogAdminRoutes.post(
  '/',
  (req, _res, next) => {
    req.body = normalizeBlogCreateInput(req.body);
    next();
  },
  validate({ params: siteCodeParamSchema, body: blogCreateBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(blogController.create),
);

blogAdminRoutes.get(
  '/:blogId',
  validate({ params: blogIdParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(blogController.get),
);

blogAdminRoutes.put(
  '/:blogId',
  (req, _res, next) => {
    req.body = normalizeBlogUpdateInput(req.body);
    next();
  },
  validate({ params: blogIdParamSchema, body: blogUpdateBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(blogController.update),
);

blogAdminRoutes.patch(
  '/:blogId',
  validate({ params: blogIdParamSchema, body: blogPatchBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(blogController.patch),
);

blogAdminRoutes.delete(
  '/:blogId',
  validate({ params: blogIdParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(blogController.remove),
);

/** @deprecated Prefer blogAdminRoutes — kept for any accidental imports. */
export const blogRoutes = blogAdminRoutes;

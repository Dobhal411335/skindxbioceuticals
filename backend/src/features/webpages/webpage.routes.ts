import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { webpageController } from './webpage.controller';
import {
  normalizeWebpageContentInput,
  normalizeWebpageCreateInput,
  webpageContentPatchBodySchema,
  webpageCreateBodySchema,
  webpageIdParamSchema,
  webpageMetaPatchBodySchema,
} from './webpage.validation';

/**
 * Mounted under `/admin` after authenticate + ADMIN/SUPER_ADMIN authorize.
 * Base path: `/sites/:siteCode/webpages`
 */
export const webpageAdminRoutes = Router({ mergeParams: true });

webpageAdminRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(webpageController.list),
);

webpageAdminRoutes.post(
  '/',
  (req, _res, next) => {
    req.body = normalizeWebpageCreateInput(req.body);
    next();
  },
  validate({ params: siteCodeParamSchema, body: webpageCreateBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(webpageController.create),
);

webpageAdminRoutes.get(
  '/:webpageId',
  validate({ params: webpageIdParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(webpageController.get),
);

/** Full content update (edit page). */
webpageAdminRoutes.put(
  '/:webpageId',
  (req, _res, next) => {
    req.body = normalizeWebpageContentInput(req.body);
    next();
  },
  validate({ params: webpageIdParamSchema, body: webpageContentPatchBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(webpageController.updateContent),
);

/** List-level meta (title/slug/active/templateType). */
webpageAdminRoutes.patch(
  '/:webpageId',
  (req, _res, next) => {
    req.body = normalizeWebpageCreateInput(req.body);
    next();
  },
  validate({ params: webpageIdParamSchema, body: webpageMetaPatchBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(webpageController.patchMeta),
);

webpageAdminRoutes.delete(
  '/:webpageId',
  validate({ params: webpageIdParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(webpageController.remove),
);

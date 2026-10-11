import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { galleryController } from './gallery.controller';
import {
  galleryItemBodySchema,
  galleryItemIdParamSchema,
  galleryItemListQuerySchema,
  galleryItemPatchSchema,
  normalizeGalleryItemInput,
} from './gallery.validation';

/**
 * Mounted under `/admin` after authenticate + ADMIN/SUPER_ADMIN authorize.
 */
export const galleryRoutes = Router({ mergeParams: true });

galleryRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema, query: galleryItemListQuerySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(galleryController.list),
);

galleryRoutes.post(
  '/',
  (req, _res, next) => {
    req.body = normalizeGalleryItemInput(req.body);
    next();
  },
  validate({ params: siteCodeParamSchema, body: galleryItemBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(galleryController.create),
);

galleryRoutes.put(
  '/:itemId',
  (req, _res, next) => {
    req.body = normalizeGalleryItemInput(req.body);
    next();
  },
  validate({ params: galleryItemIdParamSchema, body: galleryItemBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(galleryController.update),
);

galleryRoutes.patch(
  '/:itemId',
  validate({ params: galleryItemIdParamSchema, body: galleryItemPatchSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(galleryController.patch),
);

galleryRoutes.delete(
  '/:itemId',
  validate({ params: galleryItemIdParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(galleryController.remove),
);

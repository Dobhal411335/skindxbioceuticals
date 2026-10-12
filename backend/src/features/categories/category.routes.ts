import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { categoryController } from './category.controller';
import {
  categoryBodySchema,
  categoryIdParamSchema,
  categoryPatchSchema,
  normalizeCategoryInput,
  normalizeSubcategoryInput,
  subcategoryBodySchema,
  subcategoryIdParamSchema,
  subcategoryPatchSchema,
} from './category.validation';

/**
 * Mounted under `/admin` after authenticate + ADMIN/SUPER_ADMIN authorize.
 */
export const categoryRoutes = Router({ mergeParams: true });

categoryRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(categoryController.list),
);

categoryRoutes.post(
  '/',
  (req, _res, next) => {
    req.body = normalizeCategoryInput(req.body);
    next();
  },
  validate({ params: siteCodeParamSchema, body: categoryBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(categoryController.create),
);

categoryRoutes.put(
  '/:categoryId',
  (req, _res, next) => {
    req.body = normalizeCategoryInput(req.body);
    next();
  },
  validate({ params: categoryIdParamSchema, body: categoryBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(categoryController.update),
);

categoryRoutes.patch(
  '/:categoryId',
  validate({ params: categoryIdParamSchema, body: categoryPatchSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(categoryController.patch),
);

categoryRoutes.delete(
  '/:categoryId',
  validate({ params: categoryIdParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(categoryController.remove),
);

categoryRoutes.get(
  '/:categoryId/subcategories',
  validate({ params: categoryIdParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(categoryController.listSubcategories),
);

categoryRoutes.post(
  '/:categoryId/subcategories',
  (req, _res, next) => {
    req.body = normalizeSubcategoryInput(req.body);
    next();
  },
  validate({ params: categoryIdParamSchema, body: subcategoryBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(categoryController.createSubcategory),
);

categoryRoutes.put(
  '/:categoryId/subcategories/:subcategoryId',
  (req, _res, next) => {
    req.body = normalizeSubcategoryInput(req.body);
    next();
  },
  validate({ params: subcategoryIdParamSchema, body: subcategoryBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(categoryController.updateSubcategory),
);

categoryRoutes.patch(
  '/:categoryId/subcategories/:subcategoryId',
  validate({ params: subcategoryIdParamSchema, body: subcategoryPatchSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(categoryController.patchSubcategory),
);

categoryRoutes.delete(
  '/:categoryId/subcategories/:subcategoryId',
  validate({ params: subcategoryIdParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(categoryController.removeSubcategory),
);

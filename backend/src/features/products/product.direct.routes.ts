import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { productController } from './product.controller';
import {
  catalogProductBodySchema,
  catalogProductPatchSchema,
  directProductIdParamSchema,
  directProductsParamSchema,
  normalizeCatalogProductInput,
} from './product.validation';

/**
 * Mounted under `/admin/sites/:siteCode/products/direct`
 * after authenticate + ADMIN/SUPER_ADMIN authorize.
 * Lists and manages products with productType = DIRECT (no subcategory).
 */
export const directProductRoutes = Router({ mergeParams: true });

directProductRoutes.get(
  '/',
  validate({ params: directProductsParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(productController.listDirect),
);

directProductRoutes.post(
  '/',
  (req, _res, next) => {
    req.body = normalizeCatalogProductInput(req.body);
    next();
  },
  validate({ params: directProductsParamSchema, body: catalogProductBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(productController.createDirect),
);

directProductRoutes.put(
  '/:productId',
  (req, _res, next) => {
    req.body = normalizeCatalogProductInput(req.body);
    next();
  },
  validate({ params: directProductIdParamSchema, body: catalogProductBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(productController.updateDirect),
);

directProductRoutes.patch(
  '/:productId',
  validate({ params: directProductIdParamSchema, body: catalogProductPatchSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(productController.patchDirect),
);

directProductRoutes.delete(
  '/:productId',
  validate({ params: directProductIdParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(productController.removeDirect),
);

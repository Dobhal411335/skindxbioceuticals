import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { productController } from './product.controller';
import {
  catalogProductBodySchema,
  catalogProductIdParamSchema,
  catalogProductPatchSchema,
  normalizeCatalogProductInput,
  subcategoryProductsParamSchema,
} from './product.validation';

/**
 * Mounted under `/admin/sites/:siteCode/subcategories/:subcategoryId/products`
 * after authenticate + ADMIN/SUPER_ADMIN authorize.
 */
export const catalogProductRoutes = Router({ mergeParams: true });

catalogProductRoutes.get(
  '/',
  validate({ params: subcategoryProductsParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(productController.listForSubcategory),
);

catalogProductRoutes.post(
  '/',
  (req, _res, next) => {
    req.body = normalizeCatalogProductInput(req.body);
    next();
  },
  validate({ params: subcategoryProductsParamSchema, body: catalogProductBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(productController.createForSubcategory),
);

catalogProductRoutes.put(
  '/:productId',
  (req, _res, next) => {
    req.body = normalizeCatalogProductInput(req.body);
    next();
  },
  validate({ params: catalogProductIdParamSchema, body: catalogProductBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(productController.updateForSubcategory),
);

catalogProductRoutes.patch(
  '/:productId',
  validate({ params: catalogProductIdParamSchema, body: catalogProductPatchSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(productController.patchForSubcategory),
);

catalogProductRoutes.delete(
  '/:productId',
  validate({ params: catalogProductIdParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(productController.removeForSubcategory),
);

/** Legacy scaffold export kept for `/products` mount compatibility. */
export const productRoutes = Router();
productRoutes.get('/status', (_req, res) => {
  res.json({ success: true, message: 'Product module ready', data: { feature: 'product' } });
});

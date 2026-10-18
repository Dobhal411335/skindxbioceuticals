import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { productPricesController } from './product-prices.controller';
import {
  adminProductPriceApplyBodySchema,
  adminProductPriceListQuerySchema,
  adminProductPriceSiteParamSchema,
} from './product-prices.validation';

/**
 * Mounted under `/admin/sites/:siteCode/product-prices`
 * after authenticate + ADMIN/SUPER_ADMIN authorize.
 */
export const productPricesAdminRoutes = Router({ mergeParams: true });

productPricesAdminRoutes.get(
  '/',
  validate({
    params: adminProductPriceSiteParamSchema,
    query: adminProductPriceListQuerySchema,
  }),
  requireSiteAccess('siteCode'),
  asyncHandler(productPricesController.listPreview),
);

productPricesAdminRoutes.post(
  '/apply',
  validate({
    params: adminProductPriceSiteParamSchema,
    body: adminProductPriceApplyBodySchema,
  }),
  requireSiteAccess('siteCode'),
  asyncHandler(productPricesController.apply),
);

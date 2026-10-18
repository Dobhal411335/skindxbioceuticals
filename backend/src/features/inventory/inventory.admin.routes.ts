import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { inventoryController } from './inventory.controller';
import {
  adminStockListQuerySchema,
  adminStockVariantParamSchema,
  adminStockVariantQtyBodySchema,
} from './inventory.validation';

/**
 * Mounted under `/admin/sites/:siteCode/stock`
 * after authenticate + ADMIN/SUPER_ADMIN authorize.
 */
export const inventoryAdminRoutes = Router({ mergeParams: true });

inventoryAdminRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema, query: adminStockListQuerySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(inventoryController.listStock),
);

inventoryAdminRoutes.patch(
  '/variants/:variantId',
  validate({
    params: adminStockVariantParamSchema,
    body: adminStockVariantQtyBodySchema,
  }),
  requireSiteAccess('siteCode'),
  asyncHandler(inventoryController.updateVariantQty),
);

import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { adminOrdersController } from './admin-orders.controller';
import {
  adminOrderLogQuerySchema,
  adminOrderLogSiteParamSchema,
} from './admin-orders.validation';

/**
 * Mounted under `/admin` after authenticate + ADMIN/SUPER_ADMIN authorize.
 * Paths:
 * - `/admin/sites/:siteCode/orders/online-log`
 * - `/admin/sites/:siteCode/orders/cancelled`
 */
export const adminOrdersRoutes = Router({ mergeParams: true });

adminOrdersRoutes.get(
  '/online-log',
  validate({ params: adminOrderLogSiteParamSchema, query: adminOrderLogQuerySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(adminOrdersController.listOnline),
);

adminOrdersRoutes.get(
  '/cancelled',
  validate({ params: adminOrderLogSiteParamSchema, query: adminOrderLogQuerySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(adminOrdersController.listCancelled),
);

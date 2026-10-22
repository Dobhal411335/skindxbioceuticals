import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { adminOrdersController } from './admin-orders.controller';
import {
  adminOrderEnquiryQuerySchema,
  adminOrderIdParamSchema,
  adminOrderLogQuerySchema,
  adminOrderLogSiteParamSchema,
  adminOrderUpdateStatusBodySchema,
} from './admin-orders.validation';

/**
 * Mounted under `/admin/sites/:siteCode/orders` after authenticate + ADMIN/SUPER_ADMIN authorize.
 * Paths:
 * - `GET  /admin/sites/:siteCode/orders/online-log`
 * - `GET  /admin/sites/:siteCode/orders/cancelled`
 * - `GET  /admin/sites/:siteCode/orders/enquiry`
 * - `GET  /admin/sites/:siteCode/orders/:orderId`
 * - `PATCH /admin/sites/:siteCode/orders/:orderId/status`
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

adminOrdersRoutes.get(
  '/vendor',
  validate({ params: adminOrderLogSiteParamSchema, query: adminOrderLogQuerySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(adminOrdersController.listVendor),
);

adminOrdersRoutes.get(
  '/enquiry',
  validate({ params: adminOrderLogSiteParamSchema, query: adminOrderEnquiryQuerySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(adminOrdersController.listEnquiry),
);

adminOrdersRoutes.get(
  '/:orderId',
  validate({ params: adminOrderIdParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(adminOrdersController.detail),
);

adminOrdersRoutes.patch(
  '/:orderId/status',
  validate({
    params: adminOrderIdParamSchema,
    body: adminOrderUpdateStatusBodySchema,
  }),
  requireSiteAccess('siteCode'),
  asyncHandler(adminOrdersController.updateStatus),
);

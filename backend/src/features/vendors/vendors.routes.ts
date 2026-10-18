import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { vendorsController } from './vendors.controller';
import {
  vendorApplicationIdParamSchema,
  vendorApplicationListQuerySchema,
  vendorApplicationStatusPatchSchema,
  vendorCredentialActivePatchSchema,
  vendorCredentialIdParamSchema,
  vendorCredentialsListQuerySchema,
} from './vendors.validation';

/**
 * Mounted under `/admin` after authenticate + ADMIN/SUPER_ADMIN authorize.
 * Path: `/admin/sites/:siteCode/vendors`
 */
export const vendorsAdminRoutes = Router({ mergeParams: true });

vendorsAdminRoutes.get(
  '/applications',
  validate({ params: siteCodeParamSchema, query: vendorApplicationListQuerySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(vendorsController.list),
);

vendorsAdminRoutes.get(
  '/applications/:applicationId',
  validate({ params: vendorApplicationIdParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(vendorsController.get),
);

vendorsAdminRoutes.patch(
  '/applications/:applicationId/status',
  validate({
    params: vendorApplicationIdParamSchema,
    body: vendorApplicationStatusPatchSchema,
  }),
  requireSiteAccess('siteCode'),
  asyncHandler(vendorsController.patchStatus),
);

vendorsAdminRoutes.get(
  '/credentials',
  validate({ params: siteCodeParamSchema, query: vendorCredentialsListQuerySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(vendorsController.listCredentials),
);

vendorsAdminRoutes.patch(
  '/credentials/:applicationId/active',
  validate({
    params: vendorCredentialIdParamSchema,
    body: vendorCredentialActivePatchSchema,
  }),
  requireSiteAccess('siteCode'),
  asyncHandler(vendorsController.patchActive),
);

vendorsAdminRoutes.post(
  '/credentials/:applicationId/regenerate-password',
  validate({ params: vendorCredentialIdParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(vendorsController.regeneratePassword),
);

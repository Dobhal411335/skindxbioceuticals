import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { enquiryController } from './enquiry.controller';
import {
  enquiryIdParamSchema,
  enquiryListQuerySchema,
  enquiryPatchBodySchema,
} from './enquiry.validation';

/**
 * Mounted under `/admin` after authenticate + ADMIN/SUPER_ADMIN authorize.
 * Path: `/admin/sites/:siteCode/enquiries`
 */
export const enquiryAdminRoutes = Router({ mergeParams: true });

enquiryAdminRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema, query: enquiryListQuerySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(enquiryController.list),
);

enquiryAdminRoutes.get(
  '/:enquiryId',
  validate({ params: enquiryIdParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(enquiryController.get),
);

enquiryAdminRoutes.patch(
  '/:enquiryId',
  validate({
    params: enquiryIdParamSchema,
    body: enquiryPatchBodySchema,
  }),
  requireSiteAccess('siteCode'),
  asyncHandler(enquiryController.patch),
);

/** @deprecated Keep export alias for any older imports of scaffold routes. */
export const enquiryRoutes = enquiryAdminRoutes;

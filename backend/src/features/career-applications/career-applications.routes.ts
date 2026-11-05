import { Router } from 'express';

import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { careerApplicationController } from './career-applications.controller';
import {
  careerApplicationIdParamSchema,
  careerApplicationListQuerySchema,
  careerApplicationPatchBodySchema,
} from './career-applications.validation';

/**
 * Mounted under `/admin` after authenticate + ADMIN/SUPER_ADMIN authorize.
 * Path: `/admin/sites/:siteCode/career-applications`
 */
export const careerApplicationAdminRoutes = Router({ mergeParams: true });

careerApplicationAdminRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema, query: careerApplicationListQuerySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(careerApplicationController.list),
);

careerApplicationAdminRoutes.get(
  '/:applicationId/resume-access',
  validate({ params: careerApplicationIdParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(careerApplicationController.resumeAccess),
);

careerApplicationAdminRoutes.get(
  '/:applicationId',
  validate({ params: careerApplicationIdParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(careerApplicationController.get),
);

careerApplicationAdminRoutes.patch(
  '/:applicationId',
  validate({
    params: careerApplicationIdParamSchema,
    body: careerApplicationPatchBodySchema,
  }),
  requireSiteAccess('siteCode'),
  asyncHandler(careerApplicationController.patch),
);

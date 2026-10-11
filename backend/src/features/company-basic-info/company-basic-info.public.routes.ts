import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { companyBasicInfoController } from './company-basic-info.controller';

/**
 * Public storefront routes — no authentication.
 * Mounted at `/sites/:siteCode/company-basic-info`.
 */
export const companyBasicInfoPublicRoutes = Router({ mergeParams: true });

companyBasicInfoPublicRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  asyncHandler(companyBasicInfoController.getPublic),
);

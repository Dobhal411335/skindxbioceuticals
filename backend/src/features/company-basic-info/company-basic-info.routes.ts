import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { companyBasicInfoController } from './company-basic-info.controller';
import {
  companyBasicInfoBodySchema,
  normalizeCompanyBasicInfoInput,
} from './company-basic-info.validation';

/**
 * Mounted under `/admin` after authenticate + ADMIN/SUPER_ADMIN authorize.
 */
export const companyBasicInfoRoutes = Router({ mergeParams: true });

companyBasicInfoRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(companyBasicInfoController.get),
);

companyBasicInfoRoutes.put(
  '/',
  (req, _res, next) => {
    req.body = normalizeCompanyBasicInfoInput(req.body);
    next();
  },
  validate({ params: siteCodeParamSchema, body: companyBasicInfoBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(companyBasicInfoController.upsert),
);

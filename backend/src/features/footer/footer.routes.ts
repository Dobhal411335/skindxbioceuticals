import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { footerController } from './footer.controller';
import {
  footerConfigBodySchema,
  normalizeFooterConfigInput,
} from './footer.validation';

/**
 * Mounted under `/admin` after authenticate + ADMIN/SUPER_ADMIN authorize.
 */
export const footerRoutes = Router({ mergeParams: true });

footerRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(footerController.get),
);

footerRoutes.put(
  '/',
  (req, _res, next) => {
    req.body = normalizeFooterConfigInput(req.body);
    next();
  },
  validate({ params: siteCodeParamSchema, body: footerConfigBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(footerController.upsert),
);

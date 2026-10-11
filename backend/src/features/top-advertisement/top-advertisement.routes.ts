import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { topAdvertisementController } from './top-advertisement.controller';
import {
  normalizeTopAdvertisementConfigInput,
  topAdvertisementConfigBodySchema,
} from './top-advertisement.validation';

/**
 * Mounted under `/admin` after authenticate + ADMIN/SUPER_ADMIN authorize.
 */
export const topAdvertisementRoutes = Router({ mergeParams: true });

topAdvertisementRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(topAdvertisementController.get),
);

topAdvertisementRoutes.put(
  '/',
  (req, _res, next) => {
    req.body = normalizeTopAdvertisementConfigInput(req.body);
    next();
  },
  validate({
    params: siteCodeParamSchema,
    body: topAdvertisementConfigBodySchema,
  }),
  requireSiteAccess('siteCode'),
  asyncHandler(topAdvertisementController.upsert),
);

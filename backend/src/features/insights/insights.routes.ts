import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { insightsController } from './insights.controller';
import {
  insightsConfigBodySchema,
  normalizeInsightsConfigInput,
} from './insights.validation';

/**
 * Mounted under `/admin` after authenticate + ADMIN/SUPER_ADMIN authorize.
 */
export const insightsRoutes = Router({ mergeParams: true });

insightsRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(insightsController.get),
);

insightsRoutes.put(
  '/',
  (req, _res, next) => {
    req.body = normalizeInsightsConfigInput(req.body);
    next();
  },
  validate({ params: siteCodeParamSchema, body: insightsConfigBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(insightsController.upsert),
);

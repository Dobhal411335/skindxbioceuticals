import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { insightsController } from './insights.controller';

/**
 * Public storefront routes — no authentication.
 * Mounted at `/sites/:siteCode/insights`.
 */
export const insightsPublicRoutes = Router({ mergeParams: true });

insightsPublicRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  asyncHandler(insightsController.getPublic),
);

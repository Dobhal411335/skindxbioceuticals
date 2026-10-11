import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { topAdvertisementController } from './top-advertisement.controller';

/**
 * Public storefront routes — no authentication.
 * Mounted at `/sites/:siteCode/top-advertisement`.
 */
export const topAdvertisementPublicRoutes = Router({ mergeParams: true });

topAdvertisementPublicRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  asyncHandler(topAdvertisementController.getPublic),
);

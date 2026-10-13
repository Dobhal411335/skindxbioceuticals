import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { doctorPageController } from './doctor-page.controller';

/**
 * Public storefront routes — no authentication.
 * Mounted at `/sites/:siteCode/doctor-page`.
 */
export const doctorPagePublicRoutes = Router({ mergeParams: true });

doctorPagePublicRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  asyncHandler(doctorPageController.getPublic),
);

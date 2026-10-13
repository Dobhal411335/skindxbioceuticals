import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { doctorProfilesController } from './doctor-profiles.controller';

/**
 * Public storefront routes — no authentication.
 * Mounted at `/sites/:siteCode/doctors`.
 */
export const doctorProfilesPublicRoutes = Router({ mergeParams: true });

doctorProfilesPublicRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  asyncHandler(doctorProfilesController.listPublic),
);

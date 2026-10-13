import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { doctorProfilesController } from './doctor-profiles.controller';
import {
  doctorProfileBodySchema,
  doctorProfileIdParamSchema,
  doctorProfilePatchSchema,
  normalizeDoctorProfileInput,
} from './doctor-profiles.validation';

/**
 * Mounted under `/admin` after authenticate + ADMIN/SUPER_ADMIN authorize.
 * Path: `/admin/sites/:siteCode/doctors`
 */
export const doctorProfilesRoutes = Router({ mergeParams: true });

doctorProfilesRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(doctorProfilesController.list),
);

doctorProfilesRoutes.post(
  '/',
  (req, _res, next) => {
    req.body = normalizeDoctorProfileInput(req.body);
    next();
  },
  validate({ params: siteCodeParamSchema, body: doctorProfileBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(doctorProfilesController.create),
);

doctorProfilesRoutes.put(
  '/:doctorId',
  (req, _res, next) => {
    req.body = normalizeDoctorProfileInput(req.body);
    next();
  },
  validate({ params: doctorProfileIdParamSchema, body: doctorProfileBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(doctorProfilesController.update),
);

doctorProfilesRoutes.patch(
  '/:doctorId',
  validate({ params: doctorProfileIdParamSchema, body: doctorProfilePatchSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(doctorProfilesController.patch),
);

doctorProfilesRoutes.delete(
  '/:doctorId',
  validate({ params: doctorProfileIdParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(doctorProfilesController.remove),
);

import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { doctorPageController } from './doctor-page.controller';
import {
  doctorPageConfigBodySchema,
  normalizeDoctorPageConfigInput,
} from './doctor-page.validation';

/**
 * Admin doctor landing page config.
 * Mounted at `/admin/sites/:siteCode/doctor-page`.
 */
export const doctorPageRoutes = Router({ mergeParams: true });

doctorPageRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(doctorPageController.get),
);

doctorPageRoutes.put(
  '/',
  (req, _res, next) => {
    req.body = normalizeDoctorPageConfigInput(req.body);
    next();
  },
  validate({
    params: siteCodeParamSchema,
    body: doctorPageConfigBodySchema,
  }),
  requireSiteAccess('siteCode'),
  asyncHandler(doctorPageController.upsert),
);

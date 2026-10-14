import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { doctorAppointmentsController } from './doctor-appointments.controller';
import {
  doctorAppointmentIdParamSchema,
  doctorAppointmentListQuerySchema,
  doctorAppointmentPatchBodySchema,
} from './doctor-appointments.validation';

/**
 * Mounted under `/admin` after authenticate + ADMIN/SUPER_ADMIN authorize.
 * Path: `/admin/sites/:siteCode/doctor-appointments`
 */
export const doctorAppointmentsRoutes = Router({ mergeParams: true });

doctorAppointmentsRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema, query: doctorAppointmentListQuerySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(doctorAppointmentsController.list),
);

doctorAppointmentsRoutes.get(
  '/:appointmentId',
  validate({ params: doctorAppointmentIdParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(doctorAppointmentsController.get),
);

doctorAppointmentsRoutes.patch(
  '/:appointmentId',
  validate({
    params: doctorAppointmentIdParamSchema,
    body: doctorAppointmentPatchBodySchema,
  }),
  requireSiteAccess('siteCode'),
  asyncHandler(doctorAppointmentsController.patch),
);

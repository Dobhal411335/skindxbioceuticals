import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { createRateLimiter } from '@/middlewares/rate-limit.middleware';
import { doctorAppointmentsController } from './doctor-appointments.controller';
import {
  doctorAppointmentCreateBodySchema,
  normalizeDoctorAppointmentCreateInput,
} from './doctor-appointments.validation';

/**
 * Public storefront routes — no authentication.
 * Mounted at `/sites/:siteCode/doctor-appointments`.
 */
export const doctorAppointmentsPublicRoutes = Router({ mergeParams: true });

const appointmentCreateRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: 'doctor-appointment-create',
});

doctorAppointmentsPublicRoutes.post(
  '/',
  appointmentCreateRateLimiter,
  (req, _res, next) => {
    req.body = normalizeDoctorAppointmentCreateInput(req.body);
    next();
  },
  validate({ params: siteCodeParamSchema, body: doctorAppointmentCreateBodySchema }),
  asyncHandler(doctorAppointmentsController.createPublic),
);

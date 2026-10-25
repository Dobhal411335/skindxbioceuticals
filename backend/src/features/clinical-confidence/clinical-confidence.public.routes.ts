import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { clinicalConfidenceController } from './clinical-confidence.controller';

export const clinicalConfidencePublicRoutes = Router({ mergeParams: true });
clinicalConfidencePublicRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  asyncHandler(clinicalConfidenceController.getPublic),
);

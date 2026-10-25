import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { clinicalConfidenceController } from './clinical-confidence.controller';
import {
  clinicalConfidenceConfigBodySchema,
  normalizeClinicalConfidenceConfigInput,
} from './clinical-confidence.validation';

export const clinicalConfidenceRoutes = Router({ mergeParams: true });
clinicalConfidenceRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(clinicalConfidenceController.get),
);
clinicalConfidenceRoutes.put(
  '/',
  (req, _res, next) => {
    req.body = normalizeClinicalConfidenceConfigInput(req.body);
    next();
  },
  validate({ params: siteCodeParamSchema, body: clinicalConfidenceConfigBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(clinicalConfidenceController.upsert),
);

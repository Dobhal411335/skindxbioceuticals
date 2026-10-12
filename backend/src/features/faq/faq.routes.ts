import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { faqController } from './faq.controller';
import { faqConfigBodySchema, normalizeFaqConfigInput } from './faq.validation';

/**
 * Mounted under `/admin` after authenticate + ADMIN/SUPER_ADMIN authorize.
 */
export const faqRoutes = Router({ mergeParams: true });

faqRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(faqController.get),
);

faqRoutes.put(
  '/',
  (req, _res, next) => {
    req.body = normalizeFaqConfigInput(req.body);
    next();
  },
  validate({ params: siteCodeParamSchema, body: faqConfigBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(faqController.upsert),
);

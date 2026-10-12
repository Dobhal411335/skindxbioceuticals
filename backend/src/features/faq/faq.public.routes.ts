import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { faqController } from './faq.controller';
import { faqPublicQuerySchema } from './faq.validation';

/**
 * Public storefront routes — no authentication.
 * Mounted at `/sites/:siteCode/faq`.
 */
export const faqPublicRoutes = Router({ mergeParams: true });

faqPublicRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema, query: faqPublicQuerySchema }),
  asyncHandler(faqController.getPublic),
);

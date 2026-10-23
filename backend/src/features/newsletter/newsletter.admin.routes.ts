import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { newsletterController } from './newsletter.controller';
import { sendPromotionalEmailBodySchema } from './newsletter.validation';

export const newsletterAdminRoutes = Router({ mergeParams: true });

newsletterAdminRoutes.get(
  '/subscribers',
  validate({ params: siteCodeParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(newsletterController.listSubscribers),
);

newsletterAdminRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(newsletterController.listSubscribers),
);

newsletterAdminRoutes.post(
  '/send',
  validate({ params: siteCodeParamSchema, body: sendPromotionalEmailBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(newsletterController.sendPromotionalEmail),
);

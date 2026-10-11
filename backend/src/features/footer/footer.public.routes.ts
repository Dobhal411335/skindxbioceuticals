import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { footerController } from './footer.controller';

/**
 * Public storefront routes — no authentication.
 * Mounted at `/sites/:siteCode/footer`.
 */
export const footerPublicRoutes = Router({ mergeParams: true });

footerPublicRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  asyncHandler(footerController.getPublic),
);

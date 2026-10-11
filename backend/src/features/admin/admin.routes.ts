import { Router } from 'express';
import { adminController } from './admin.controller';
import { asyncHandler } from '@/utils/asyncHandler';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { companyBasicInfoRoutes } from '@/features/company-basic-info/company-basic-info.routes';
import { dashboardQuerySchema, siteCodeParamSchema } from './admin.validation';

/**
 * Admin routes - wiring only.
 * Protected by JWT auth + ADMIN / SUPER_ADMIN roles.
 */
const router = Router();

router.get('/status', asyncHandler(adminController.status));

router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/sites', asyncHandler(adminController.listSites));

router.get(
  '/sites/:siteCode/dashboard',
  validate({ params: siteCodeParamSchema, query: dashboardQuerySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(adminController.dashboard),
);

router.use('/sites/:siteCode/company-basic-info', companyBasicInfoRoutes);

export const adminRoutes = router;

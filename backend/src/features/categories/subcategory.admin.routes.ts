import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { categoryController } from './category.controller';
import { subcategoryOnlyParamSchema } from './category.validation';

/**
 * Mounted under `/admin/sites/:siteCode/subcategories`
 * after authenticate + ADMIN/SUPER_ADMIN authorize.
 */
export const subcategoryAdminRoutes = Router({ mergeParams: true });

subcategoryAdminRoutes.get(
  '/:subcategoryId',
  validate({ params: subcategoryOnlyParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(categoryController.getSubcategory),
);

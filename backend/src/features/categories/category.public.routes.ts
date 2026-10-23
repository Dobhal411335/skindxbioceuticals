import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { categoryController } from './category.controller';
import { categorySlugParamSchema } from './category.validation';

/**
 * Mounted at `/sites/:siteCode/category`.
 */
export const categoryPublicRoutes = Router({ mergeParams: true });

categoryPublicRoutes.get(
  '/',
  validate({ params: siteCodeParamSchema }),
  asyncHandler(categoryController.listPublic),
);

categoryPublicRoutes.get(
  '/:categorySlug',
  validate({ params: categorySlugParamSchema }),
  asyncHandler(categoryController.getPublicBySlug),
);

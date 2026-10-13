import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { productController } from './product.controller';
import {
  publicProductListQuerySchema,
  publicProductSiteParamSchema,
  publicProductSlugParamSchema,
} from './product.validation';

/**
 * Mounted at `/sites/:siteCode/products`.
 * Static paths (`/`, `/highlights`) must stay above `/:slug`.
 */
export const productPublicRoutes = Router({ mergeParams: true });

productPublicRoutes.get(
  '/',
  validate({
    params: publicProductSiteParamSchema,
    query: publicProductListQuerySchema,
  }),
  asyncHandler(productController.listPublic),
);

productPublicRoutes.get(
  '/highlights',
  validate({ params: publicProductSiteParamSchema }),
  asyncHandler(productController.listPublicHighlights),
);

productPublicRoutes.get(
  '/:slug',
  validate({ params: publicProductSlugParamSchema }),
  asyncHandler(productController.getPublicBySlug),
);

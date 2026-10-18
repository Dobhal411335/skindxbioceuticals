import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { optionalAuthenticate } from '@/middlewares/auth.middleware';
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
 * Optional auth enables vendorPrice for VENDOR sessions.
 */
export const productPublicRoutes = Router({ mergeParams: true });

productPublicRoutes.use(optionalAuthenticate);

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
  '/facets',
  validate({ params: publicProductSiteParamSchema }),
  asyncHandler(productController.listPublicFacets),
);

productPublicRoutes.get(
  '/:slug',
  validate({ params: publicProductSlugParamSchema }),
  asyncHandler(productController.getPublicBySlug),
);

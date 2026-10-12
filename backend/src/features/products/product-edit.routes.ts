import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSiteAccess } from '@/middlewares/siteAccess.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { productEditController } from './product-edit.controller';
import {
  catalogColorBodySchema,
  catalogTagBodySchema,
  productColorsSectionSchema,
  productCouponSectionSchema,
  productDescriptionSectionSchema,
  productEditParamSchema,
  productEditorialReviewBodySchema,
  productEditorialReviewIdParamSchema,
  productGallerySectionSchema,
  productHighlightsSectionSchema,
  productInfoSectionSchema,
  productSizesSectionSchema,
  productTagsSectionSchema,
  productTaxSectionSchema,
  productVariantsSectionSchema,
  productVideosSectionSchema,
} from './product-edit.validation';
import { z } from 'zod';

const siteCodeOnlySchema = z.object({
  siteCode: z
    .enum(['IN', 'COM', 'in', 'com'])
    .transform((value) => value.toUpperCase() as 'IN' | 'COM'),
});

/**
 * Mounted under `/admin/sites/:siteCode/products`
 * after authenticate + ADMIN/SUPER_ADMIN authorize.
 */
export const productEditRoutes = Router({ mergeParams: true });

productEditRoutes.post(
  '/catalog-colors',
  validate({ params: siteCodeOnlySchema, body: catalogColorBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(productEditController.createCatalogColor),
);

productEditRoutes.post(
  '/catalog-tags',
  validate({ params: siteCodeOnlySchema, body: catalogTagBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(productEditController.createCatalogTag),
);

productEditRoutes.get(
  '/:productId/edit',
  validate({ params: productEditParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(productEditController.getEditPayload),
);

productEditRoutes.put(
  '/:productId/sections/sizes',
  validate({ params: productEditParamSchema, body: productSizesSectionSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(productEditController.updateSizes),
);

productEditRoutes.put(
  '/:productId/sections/colors',
  validate({ params: productEditParamSchema, body: productColorsSectionSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(productEditController.updateColors),
);

productEditRoutes.put(
  '/:productId/sections/variants',
  validate({ params: productEditParamSchema, body: productVariantsSectionSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(productEditController.updateVariants),
);

productEditRoutes.put(
  '/:productId/sections/coupon',
  validate({ params: productEditParamSchema, body: productCouponSectionSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(productEditController.updateCoupon),
);

productEditRoutes.put(
  '/:productId/sections/tax',
  validate({ params: productEditParamSchema, body: productTaxSectionSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(productEditController.updateTax),
);

productEditRoutes.delete(
  '/:productId/sections/tax',
  validate({ params: productEditParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(productEditController.clearTax),
);

productEditRoutes.put(
  '/:productId/sections/gallery',
  validate({ params: productEditParamSchema, body: productGallerySectionSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(productEditController.updateGallery),
);

productEditRoutes.put(
  '/:productId/sections/videos',
  validate({ params: productEditParamSchema, body: productVideosSectionSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(productEditController.updateVideos),
);

productEditRoutes.put(
  '/:productId/sections/description',
  validate({ params: productEditParamSchema, body: productDescriptionSectionSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(productEditController.updateDescription),
);

productEditRoutes.put(
  '/:productId/sections/info',
  validate({ params: productEditParamSchema, body: productInfoSectionSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(productEditController.updateInfo),
);

productEditRoutes.post(
  '/:productId/sections/reviews',
  validate({ params: productEditParamSchema, body: productEditorialReviewBodySchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(productEditController.createEditorialReview),
);

productEditRoutes.put(
  '/:productId/sections/reviews/:reviewId',
  validate({
    params: productEditorialReviewIdParamSchema,
    body: productEditorialReviewBodySchema,
  }),
  requireSiteAccess('siteCode'),
  asyncHandler(productEditController.updateEditorialReview),
);

productEditRoutes.delete(
  '/:productId/sections/reviews/:reviewId',
  validate({ params: productEditorialReviewIdParamSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(productEditController.deleteEditorialReview),
);

productEditRoutes.put(
  '/:productId/sections/tags',
  validate({ params: productEditParamSchema, body: productTagsSectionSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(productEditController.updateTags),
);

productEditRoutes.put(
  '/:productId/sections/highlights',
  validate({ params: productEditParamSchema, body: productHighlightsSectionSchema }),
  requireSiteAccess('siteCode'),
  asyncHandler(productEditController.updateHighlights),
);

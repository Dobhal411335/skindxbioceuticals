import { z } from 'zod';

const siteCodeSchema = z
  .enum(['IN', 'COM', 'in', 'com'])
  .transform((value) => value.toUpperCase() as 'IN' | 'COM');

const mediaRefSchema = z.object({
  url: z.string().trim().url().max(2000),
  publicId: z.string().trim().max(500),
});

const optionalMediaRefSchema = mediaRefSchema.nullable().optional();

export const productEditParamSchema = z.object({
  siteCode: siteCodeSchema,
  productId: z.string().uuid(),
});

export const catalogColorBodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  hex: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Hex must be #RRGGBB'),
});

export const catalogTagBodySchema = z.object({
  name: z.string().trim().min(1).max(60),
});

export const productSizesSectionSchema = z.object({
  sizeChartUrl: z.string().trim().url().max(2000).nullable().optional(),
  sizeChartPublicId: z.string().trim().max(500).nullable().optional(),
  sizes: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(40),
        active: z.boolean().default(true),
        sortOrder: z.number().int().min(0).optional(),
      }),
    )
    .max(50),
});

export const productColorsSectionSchema = z.object({
  colors: z
    .array(
      z.object({
        colorId: z.string().uuid().nullable().optional(),
        name: z.string().trim().min(1).max(80),
        hex: z
          .string()
          .trim()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .nullable()
          .optional(),
        active: z.boolean().default(true),
        sortOrder: z.number().int().min(0).optional(),
      }),
    )
    .max(50),
});

export const productVariantsSectionSchema = z.object({
  variants: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        sizeLabel: z.string().trim().max(40).nullable().optional(),
        colorLabel: z.string().trim().max(80).nullable().optional(),
        price: z.coerce.number().finite().min(0).max(10_000_000),
        vendorPrice: z.coerce.number().finite().min(0).max(10_000_000).nullable().optional(),
        quantity: z.coerce.number().int().min(0).max(1_000_000),
        weightGrams: z.coerce.number().int().min(0).max(1_000_000).nullable().optional(),
        isActive: z.boolean().default(true),
        profileImage: optionalMediaRefSchema,
        subImages: z.array(mediaRefSchema).max(12).default([]),
      }),
    )
    .max(100),
});

export const productCouponSectionSchema = z.object({
  couponId: z.string().uuid().nullable(),
});

export const productTaxSectionSchema = z.object({
  cgst: z.coerce.number().finite().min(0).max(100),
  sgst: z.coerce.number().finite().min(0).max(100),
});

export const productGallerySectionSchema = z.object({
  bannerUrl: z.string().trim().url().max(2000).nullable().optional(),
  bannerPublicId: z.string().trim().max(500).nullable().optional(),
  images: z
    .array(
      z.object({
        imageUrl: z.string().trim().url().max(2000),
        imagePublicId: z.string().trim().max(500),
        isPrimary: z.boolean().default(false),
        sortOrder: z.number().int().min(0).optional(),
      }),
    )
    .max(40),
});

export const productVideosSectionSchema = z.object({
  videos: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        url: z.string().trim().url().max(2000),
        description: z.string().trim().max(20_000).default(''),
        sortOrder: z.number().int().min(0).optional(),
      }),
    )
    .max(20),
});

export const productDescriptionSectionSchema = z.object({
  description: z.string().trim().max(100_000),
});

export const productInfoSectionSchema = z.object({
  sections: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(200),
        body: z.string().trim().min(1).max(50_000),
        sortOrder: z.number().int().min(0).optional(),
      }),
    )
    .max(40),
});

export const productEditorialReviewBodySchema = z.object({
  createdByName: z.string().trim().min(1).max(120),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(200).default(''),
  body: z.string().trim().min(1).max(50_000),
  imageUrl: z.string().trim().url().max(2000).nullable().optional(),
  imagePublicId: z.string().trim().max(500).nullable().optional(),
  active: z.boolean().default(true),
});

export const productEditorialReviewIdParamSchema = z.object({
  siteCode: siteCodeSchema,
  productId: z.string().uuid(),
  reviewId: z.string().uuid(),
});

export const productTagsSectionSchema = z.object({
  tagNames: z.array(z.string().trim().min(1).max(60)).max(40),
});

export const productHighlightsSectionSchema = z.object({
  highlights: z
    .array(z.string().trim().min(1).max(300))
    .max(30),
});

export type ProductSizesSectionBody = z.infer<typeof productSizesSectionSchema>;
export type ProductColorsSectionBody = z.infer<typeof productColorsSectionSchema>;
export type ProductVariantsSectionBody = z.infer<typeof productVariantsSectionSchema>;
export type ProductCouponSectionBody = z.infer<typeof productCouponSectionSchema>;
export type ProductTaxSectionBody = z.infer<typeof productTaxSectionSchema>;
export type ProductGallerySectionBody = z.infer<typeof productGallerySectionSchema>;
export type ProductVideosSectionBody = z.infer<typeof productVideosSectionSchema>;
export type ProductDescriptionSectionBody = z.infer<typeof productDescriptionSectionSchema>;
export type ProductInfoSectionBody = z.infer<typeof productInfoSectionSchema>;
export type ProductEditorialReviewBody = z.infer<typeof productEditorialReviewBodySchema>;
export type ProductTagsSectionBody = z.infer<typeof productTagsSectionSchema>;
export type ProductHighlightsSectionBody = z.infer<typeof productHighlightsSectionSchema>;
export type CatalogColorBody = z.infer<typeof catalogColorBodySchema>;
export type CatalogTagBody = z.infer<typeof catalogTagBodySchema>;

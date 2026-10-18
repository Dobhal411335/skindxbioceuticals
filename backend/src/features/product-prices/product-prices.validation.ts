import { z } from 'zod';

const siteCodeSchema = z
  .enum(['IN', 'COM', 'in', 'com'])
  .transform((value) => value.toUpperCase() as 'IN' | 'COM');

/** Percent must be non-zero; positive = increase, negative = decrease. */
export const pricePercentSchema = z.coerce
  .number()
  .finite()
  .refine((value) => value !== 0, { message: 'percent must be non-zero' })
  .refine((value) => value > -100 && value <= 1000, {
    message: 'percent must be greater than -100 and at most 1000',
  });

export const adminProductPriceListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z
    .enum(['all', 'active', 'draft', 'archived', 'ACTIVE', 'DRAFT', 'ARCHIVED'])
    .optional()
    .default('all'),
  categoryId: z.string().uuid().optional(),
  subcategoryId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  /** When set, response includes projected updated* prices (preview). */
  percent: pricePercentSchema.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  offset: z.coerce.number().int().min(0).max(10_000).optional(),
  limit: z.coerce.number().int().min(1).max(48).optional().default(10),
});

/**
 * Apply percent to either:
 * - one product (`productId`), or
 * - all products under a category (optional subcategory narrows scope).
 * Never accepts client-computed final prices.
 */
export const adminProductPriceApplyBodySchema = z
  .object({
    percent: pricePercentSchema,
    categoryId: z.string().uuid().optional(),
    subcategoryId: z.string().uuid().optional(),
    productId: z.string().uuid().optional(),
    status: z
      .enum(['all', 'active', 'draft', 'archived', 'ACTIVE', 'DRAFT', 'ARCHIVED'])
      .optional()
      .default('all'),
    q: z.string().trim().max(120).optional(),
  })
  .superRefine((value, ctx) => {
    const hasProduct = Boolean(value.productId);
    const hasCategory = Boolean(value.categoryId);
    if (hasProduct === hasCategory) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide exactly one of productId or categoryId',
        path: hasProduct ? ['productId'] : ['categoryId'],
      });
    }
    if (value.subcategoryId && !value.categoryId && !value.productId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'categoryId is required when subcategoryId is set without productId',
        path: ['categoryId'],
      });
    }
  });

export const adminProductPriceSiteParamSchema = z.object({
  siteCode: siteCodeSchema,
});

export type AdminProductPriceListQuery = z.infer<typeof adminProductPriceListQuerySchema>;
export type AdminProductPriceApplyBody = z.infer<typeof adminProductPriceApplyBodySchema>;

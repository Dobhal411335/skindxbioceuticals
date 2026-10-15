import { z } from 'zod';

const siteCodeSchema = z
  .enum(['IN', 'COM', 'in', 'com'])
  .transform((value) => value.toUpperCase() as 'IN' | 'COM');

export const catalogProductBodySchema = z.object({
  productCode: z
    .string()
    .trim()
    .min(1, 'Product code is required')
    .max(80)
    .regex(/^[A-Za-z0-9._-]+$/, 'Product code may only contain letters, numbers, . _ -'),
  name: z.string().trim().min(1, 'Product name is required').max(200),
  active: z.boolean().default(true),
  description: z.string().trim().max(5000).optional().nullable(),
  isFeatured: z.boolean().optional().default(false),
  isRecent: z.boolean().optional().default(false),
  isBestSeller: z.boolean().optional().default(false),
});

export const catalogProductPatchSchema = z
  .object({
    active: z.boolean().optional(),
    name: z.string().trim().min(1).max(200).optional(),
    productCode: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(/^[A-Za-z0-9._-]+$/)
      .optional(),
    isFeatured: z.boolean().optional(),
    isRecent: z.boolean().optional(),
    isBestSeller: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.active !== undefined ||
      value.name !== undefined ||
      value.productCode !== undefined ||
      value.isFeatured !== undefined ||
      value.isRecent !== undefined ||
      value.isBestSeller !== undefined,
    { message: 'At least one field is required' },
  );

export const subcategoryProductsParamSchema = z.object({
  siteCode: siteCodeSchema,
  subcategoryId: z.string().uuid(),
});

export const catalogProductIdParamSchema = z.object({
  siteCode: siteCodeSchema,
  subcategoryId: z.string().uuid(),
  productId: z.string().uuid(),
});

export const publicProductSlugParamSchema = z.object({
  siteCode: siteCodeSchema,
  slug: z
    .string()
    .trim()
    .min(1, 'Product slug is required')
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, 'Invalid product slug'),
});

export const publicProductSiteParamSchema = z.object({
  siteCode: siteCodeSchema,
});

export const publicProductSortSchema = z.enum([
  'default',
  'rating',
  'price_asc',
  'price_desc',
]);

export const publicProductAvailabilitySchema = z.enum(['in_stock', 'out_of_stock']);

export const publicProductListQuerySchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    categorySlug: z
      .string()
      .trim()
      .max(200)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, 'Invalid category slug')
      .optional(),
    priceMin: z.coerce.number().min(0).max(1_000_000).optional(),
    priceMax: z.coerce.number().min(0).max(1_000_000).optional(),
    availability: publicProductAvailabilitySchema.optional(),
    sort: publicProductSortSchema.optional().default('default'),
    page: z.coerce.number().int().min(1).optional().default(1),
    offset: z.coerce.number().int().min(0).max(10_000).optional(),
    limit: z.coerce.number().int().min(1).max(48).optional().default(15),
  })
  .superRefine((value, ctx) => {
    if (
      value.priceMin != null &&
      value.priceMax != null &&
      value.priceMin > value.priceMax
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'priceMin cannot be greater than priceMax',
        path: ['priceMin'],
      });
    }
  });

const dateOnlySchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

/** Admin View All Products list filters (site-scoped). */
export const adminProductListQuerySchema = z
  .object({
    /** `today` (default) | `all` | `day` (requires `date`) */
    period: z.enum(['today', 'all', 'day']).optional().default('today'),
    date: dateOnlySchema.optional(),
    status: z.enum(['all', 'active', 'draft']).optional().default('all'),
    q: z.string().trim().max(120).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    offset: z.coerce.number().int().min(0).max(10_000).optional(),
    limit: z.coerce.number().int().min(1).max(48).optional().default(10),
  })
  .superRefine((value, ctx) => {
    if (value.period === 'day' && !value.date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'date is required when period is day',
        path: ['date'],
      });
    }
  });

export const adminProductIdParamSchema = z.object({
  siteCode: siteCodeSchema,
  productId: z.string().uuid(),
});

export type CatalogProductBody = z.infer<typeof catalogProductBodySchema>;
export type CatalogProductPatchBody = z.infer<typeof catalogProductPatchSchema>;
export type PublicProductSlugParam = z.infer<typeof publicProductSlugParamSchema>;
export type PublicProductListQuery = z.infer<typeof publicProductListQuerySchema>;
export type PublicProductSort = z.infer<typeof publicProductSortSchema>;
export type PublicProductAvailability = z.infer<typeof publicProductAvailabilitySchema>;
export type AdminProductListQuery = z.infer<typeof adminProductListQuerySchema>;

export function normalizeCatalogProductInput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const payload = raw as Record<string, unknown>;
  return {
    ...payload,
    productCode:
      typeof payload.productCode === 'string'
        ? payload.productCode.trim()
        : typeof payload.code === 'string'
          ? payload.code.trim()
          : payload.productCode,
    name: typeof payload.name === 'string' ? payload.name.trim() : payload.name,
    active: payload.active ?? true,
    description:
      typeof payload.description === 'string'
        ? payload.description.trim()
        : payload.description,
    isFeatured: payload.isFeatured ?? false,
    isRecent: payload.isRecent ?? false,
    isBestSeller: payload.isBestSeller ?? false,
  };
}

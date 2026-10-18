import { z } from 'zod';

const siteCodeSchema = z
  .enum(['IN', 'COM', 'in', 'com'])
  .transform((value) => value.toUpperCase() as 'IN' | 'COM');

export const adminStockListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z
    .enum(['all', 'active', 'draft', 'archived', 'ACTIVE', 'DRAFT', 'ARCHIVED'])
    .optional()
    .default('all'),
  categoryId: z.string().uuid().optional(),
  subcategoryId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  offset: z.coerce.number().int().min(0).max(10_000).optional(),
  limit: z.coerce.number().int().min(1).max(48).optional().default(10),
});

export const adminStockVariantParamSchema = z.object({
  siteCode: siteCodeSchema,
  variantId: z.string().uuid(),
});

/** Absolute quantity on hand (after +/- UI adjusts local state then Save). */
export const adminStockVariantQtyBodySchema = z.object({
  quantity: z.coerce.number().int().min(0).max(1_000_000),
});

export type AdminStockListQuery = z.infer<typeof adminStockListQuerySchema>;
export type AdminStockVariantParam = z.infer<typeof adminStockVariantParamSchema>;
export type AdminStockVariantQtyBody = z.infer<typeof adminStockVariantQtyBodySchema>;

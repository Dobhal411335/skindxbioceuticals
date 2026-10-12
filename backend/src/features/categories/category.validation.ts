import { z } from 'zod';

const siteCodeSchema = z
  .enum(['IN', 'COM', 'in', 'com'])
  .transform((value) => value.toUpperCase() as 'IN' | 'COM');

const bannerUrlSchema = z
  .string()
  .trim()
  .min(1, 'Category banner URL is required')
  .max(2000)
  .url('Category banner URL must be a valid absolute URL')
  .refine((value) => value.startsWith('https://') || value.startsWith('http://'), {
    message: 'Category banner URL must use http or https',
  });

export const categoryBodySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(160),
  bannerUrl: bannerUrlSchema,
  bannerPublicId: z.string().trim().max(500).default(''),
  active: z.boolean().default(true),
  order: z.coerce.number().int().min(0).max(10_000).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
});

export const categoryPatchSchema = z
  .object({
    active: z.boolean().optional(),
    order: z.coerce.number().int().min(0).max(10_000).optional(),
  })
  .refine((value) => value.active !== undefined || value.order !== undefined, {
    message: 'At least one of active or order is required',
  });

export const subcategoryBodySchema = z.object({
  name: z.string().trim().min(1, 'Subcategory name is required').max(160),
  active: z.boolean().default(true),
  order: z.coerce.number().int().min(0).max(10_000).optional(),
});

export const subcategoryPatchSchema = z
  .object({
    active: z.boolean().optional(),
    order: z.coerce.number().int().min(0).max(10_000).optional(),
    name: z.string().trim().min(1).max(160).optional(),
  })
  .refine(
    (value) =>
      value.active !== undefined || value.order !== undefined || value.name !== undefined,
    { message: 'At least one field is required' },
  );

export const categoryIdParamSchema = z.object({
  siteCode: siteCodeSchema,
  categoryId: z.string().uuid(),
});

export const subcategoryIdParamSchema = z.object({
  siteCode: siteCodeSchema,
  categoryId: z.string().uuid(),
  subcategoryId: z.string().uuid(),
});

export const categorySlugParamSchema = z.object({
  siteCode: siteCodeSchema,
  categorySlug: z.string().trim().min(1).max(200),
});

export type CategoryBody = z.infer<typeof categoryBodySchema>;
export type CategoryPatchBody = z.infer<typeof categoryPatchSchema>;
export type SubcategoryBody = z.infer<typeof subcategoryBodySchema>;
export type SubcategoryPatchBody = z.infer<typeof subcategoryPatchSchema>;

export function normalizeCategoryInput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const payload = raw as Record<string, unknown>;
  const banner =
    payload.banner && typeof payload.banner === 'object'
      ? (payload.banner as Record<string, unknown>)
      : null;

  const bannerUrl =
    typeof payload.bannerUrl === 'string'
      ? payload.bannerUrl.trim()
      : typeof payload.url === 'string'
        ? payload.url.trim()
        : typeof banner?.url === 'string'
          ? banner.url.trim()
          : typeof banner?.secureUrl === 'string'
            ? banner.secureUrl.trim()
            : payload.bannerUrl;

  const bannerPublicId =
    typeof payload.bannerPublicId === 'string'
      ? payload.bannerPublicId.trim()
      : typeof payload.publicId === 'string'
        ? payload.publicId.trim()
        : typeof banner?.publicId === 'string'
          ? banner.publicId.trim()
          : (payload.bannerPublicId ?? '');

  return {
    ...payload,
    name: typeof payload.name === 'string' ? payload.name.trim() : payload.name,
    bannerUrl,
    bannerPublicId,
    active: payload.active ?? true,
    order:
      payload.order === '' || payload.order === undefined || payload.order === null
        ? undefined
        : Number(payload.order),
    description:
      typeof payload.description === 'string'
        ? payload.description.trim()
        : payload.description,
  };
}

export function normalizeSubcategoryInput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const payload = raw as Record<string, unknown>;
  return {
    ...payload,
    name: typeof payload.name === 'string' ? payload.name.trim() : payload.name,
    active: payload.active ?? true,
    order:
      payload.order === '' || payload.order === undefined || payload.order === null
        ? undefined
        : Number(payload.order),
  };
}

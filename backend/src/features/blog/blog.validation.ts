import { z } from 'zod';

const siteCodeSchema = z
  .enum(['IN', 'COM', 'in', 'com'])
  .transform((value) => value.toUpperCase() as 'IN' | 'COM');

const slugSchema = z
  .string()
  .trim()
  .min(1, 'Slug is required')
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens');

const imageUrlSchema = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (value) =>
      value === '' ||
      value.startsWith('https://') ||
      value.startsWith('http://'),
    { message: 'Image URL must use http or https' },
  );

export const blogCreateBodySchema = z.object({
  name: z.string().trim().min(1, 'Blog name is required').max(200),
  category: z.string().trim().min(1, 'Blog category is required').max(120),
  slug: slugSchema.optional(),
  active: z.boolean().default(true),
});

export const blogUpdateBodySchema = z.object({
  name: z.string().trim().min(1, 'Blog name is required').max(200),
  slug: slugSchema,
  category: z.string().trim().min(1, 'Blog category is required').max(120),
  title: z.string().trim().min(1, 'Title is required').max(300),
  publishedAt: z.coerce.date({ message: 'Date is required' }),
  createdBy: z.string().trim().max(120).default(''),
  imageUrl: imageUrlSchema.default(''),
  imagePublicId: z.string().trim().max(500).default(''),
  description: z.string().max(200_000).default(''),
  blockquote: z.string().trim().max(5000).default(''),
  active: z.boolean().default(true),
});

export const blogPatchBodySchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    active: z.boolean().optional(),
  })
  .refine((value) => value.name !== undefined || value.active !== undefined, {
    message: 'At least one of name or active is required',
  });

export const blogIdParamSchema = z.object({
  siteCode: siteCodeSchema,
  blogId: z.string().uuid(),
});

export const blogSlugParamSchema = z.object({
  siteCode: siteCodeSchema,
  slug: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

export const blogAdminListQuerySchema = z.object({
  category: z.string().trim().max(120).optional(),
});

export const blogPublicListQuerySchema = z.object({
  category: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  recent: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((value) => value === true || value === 'true'),
});

export type BlogCreateBody = z.infer<typeof blogCreateBodySchema>;
export type BlogUpdateBody = z.infer<typeof blogUpdateBodySchema>;
export type BlogPatchBody = z.infer<typeof blogPatchBodySchema>;

export function normalizeBlogCreateInput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }
  const payload = raw as Record<string, unknown>;
  return {
    ...payload,
    name: typeof payload.name === 'string' ? payload.name.trim() : payload.name,
    category:
      typeof payload.category === 'string'
        ? payload.category.trim()
        : typeof payload.blogCategory === 'string'
          ? payload.blogCategory.trim()
          : payload.category,
    slug:
      typeof payload.slug === 'string' && payload.slug.trim()
        ? payload.slug.trim().toLowerCase()
        : undefined,
    active: payload.active ?? true,
  };
}

export function normalizeBlogUpdateInput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const payload = raw as Record<string, unknown>;
  const image =
    payload.image && typeof payload.image === 'object'
      ? (payload.image as Record<string, unknown>)
      : null;

  const imageUrl =
    typeof payload.imageUrl === 'string'
      ? payload.imageUrl.trim()
      : typeof payload.image === 'string'
        ? payload.image.trim()
        : typeof image?.url === 'string'
          ? image.url.trim()
          : typeof image?.secureUrl === 'string'
            ? image.secureUrl.trim()
            : payload.imageUrl;

  const imagePublicId =
    typeof payload.imagePublicId === 'string'
      ? payload.imagePublicId.trim()
      : typeof payload.publicId === 'string'
        ? payload.publicId.trim()
        : typeof image?.publicId === 'string'
          ? image.publicId.trim()
          : (payload.imagePublicId ?? '');

  const publishedAt =
    payload.publishedAt ?? payload.date ?? payload.publishedDate;

  return {
    ...payload,
    name: typeof payload.name === 'string' ? payload.name.trim() : payload.name,
    slug:
      typeof payload.slug === 'string'
        ? payload.slug.trim().toLowerCase()
        : payload.slug,
    category:
      typeof payload.category === 'string'
        ? payload.category.trim()
        : payload.category,
    title: typeof payload.title === 'string' ? payload.title.trim() : payload.title,
    publishedAt,
    createdBy:
      typeof payload.createdBy === 'string'
        ? payload.createdBy.trim()
        : typeof payload.author === 'string'
          ? payload.author.trim()
          : payload.createdBy,
    imageUrl,
    imagePublicId,
    description:
      typeof payload.description === 'string'
        ? payload.description
        : typeof payload.content === 'string'
          ? payload.content
          : payload.description,
    blockquote:
      typeof payload.blockquote === 'string'
        ? payload.blockquote.trim()
        : payload.blockquote,
    active: payload.active ?? true,
  };
}

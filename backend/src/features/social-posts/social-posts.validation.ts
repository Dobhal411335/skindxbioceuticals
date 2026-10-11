import { z } from 'zod';

const siteCodeSchema = z
  .enum(['IN', 'COM', 'in', 'com'])
  .transform((value) => value.toUpperCase() as 'IN' | 'COM');

export const socialPostTypeSchema = z.enum(['instagram', 'facebook']);

const absoluteUrlSchema = z
  .string()
  .trim()
  .min(1, 'Post URL is required')
  .max(2000)
  .url('Post URL must be a valid absolute URL');

const imageUrlSchema = z
  .string()
  .trim()
  .min(1, 'Image URL is required')
  .max(2000)
  .url('Image URL must be a valid absolute URL');

export const socialPostBodySchema = z.object({
  postType: socialPostTypeSchema,
  imageUrl: imageUrlSchema,
  imagePublicId: z.string().trim().max(500).default(''),
  postUrl: absoluteUrlSchema,
  active: z.boolean().default(true),
  order: z.coerce.number().int().min(0).max(10_000).optional(),
});

export const socialPostPatchSchema = z
  .object({
    active: z.boolean().optional(),
    order: z.coerce.number().int().min(0).max(10_000).optional(),
  })
  .refine((value) => value.active !== undefined || value.order !== undefined, {
    message: 'At least one of active or order is required',
  });

export const socialPostIdParamSchema = z.object({
  siteCode: siteCodeSchema,
  postId: z.string().uuid(),
});

export const socialPostListQuerySchema = z.object({
  postType: socialPostTypeSchema.optional(),
});

export type SocialPostBody = z.infer<typeof socialPostBodySchema>;
export type SocialPostPatchBody = z.infer<typeof socialPostPatchSchema>;

export function normalizeSocialPostInput(raw: unknown): unknown {
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
          : payload.imageUrl;

  const imagePublicId =
    typeof payload.imagePublicId === 'string'
      ? payload.imagePublicId.trim()
      : typeof payload.imageKey === 'string'
        ? payload.imageKey.trim()
        : typeof image?.publicId === 'string'
          ? image.publicId.trim()
          : typeof image?.key === 'string'
            ? image.key.trim()
            : payload.imagePublicId ?? '';

  const postUrl =
    typeof payload.postUrl === 'string'
      ? payload.postUrl.trim()
      : typeof payload.url === 'string'
        ? payload.url.trim()
        : typeof payload.link === 'string'
          ? payload.link.trim()
          : payload.postUrl;

  const postTypeRaw = payload.postType ?? payload.type;
  const postType =
    typeof postTypeRaw === 'string' ? postTypeRaw.trim().toLowerCase() : postTypeRaw;

  return {
    ...payload,
    postType,
    imageUrl,
    imagePublicId,
    postUrl,
    active: payload.active ?? true,
    order:
      payload.order === '' || payload.order === undefined || payload.order === null
        ? undefined
        : Number(payload.order),
  };
}

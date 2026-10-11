import { z } from 'zod';

const siteCodeSchema = z
  .enum(['IN', 'COM', 'in', 'com'])
  .transform((value) => value.toUpperCase() as 'IN' | 'COM');

export const galleryMediaTypeSchema = z.enum(['image', 'video']);

const mediaUrlSchema = z
  .string()
  .trim()
  .min(1, 'Media URL is required')
  .max(2000)
  .url('Media URL must be a valid absolute URL')
  .refine((value) => value.startsWith('https://') || value.startsWith('http://'), {
    message: 'Media URL must use http or https',
  });

export const galleryItemBodySchema = z.object({
  mediaType: galleryMediaTypeSchema,
  mediaUrl: mediaUrlSchema,
  mediaPublicId: z.string().trim().max(500).default(''),
  active: z.boolean().default(true),
});

export const galleryItemPatchSchema = z.object({
  active: z.boolean(),
});

export const galleryItemIdParamSchema = z.object({
  siteCode: siteCodeSchema,
  itemId: z.string().uuid(),
});

export const galleryItemListQuerySchema = z.object({
  mediaType: galleryMediaTypeSchema.optional(),
});

export type GalleryItemBody = z.infer<typeof galleryItemBodySchema>;
export type GalleryItemPatchBody = z.infer<typeof galleryItemPatchSchema>;

export function normalizeGalleryItemInput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const payload = raw as Record<string, unknown>;
  const media =
    payload.media && typeof payload.media === 'object'
      ? (payload.media as Record<string, unknown>)
      : null;

  const mediaUrl =
    typeof payload.mediaUrl === 'string'
      ? payload.mediaUrl.trim()
      : typeof payload.url === 'string'
        ? payload.url.trim()
        : typeof payload.imageUrl === 'string'
          ? payload.imageUrl.trim()
          : typeof media?.url === 'string'
            ? media.url.trim()
            : typeof media?.secureUrl === 'string'
              ? media.secureUrl.trim()
              : payload.mediaUrl;

  const mediaPublicId =
    typeof payload.mediaPublicId === 'string'
      ? payload.mediaPublicId.trim()
      : typeof payload.publicId === 'string'
        ? payload.publicId.trim()
        : typeof payload.imagePublicId === 'string'
          ? payload.imagePublicId.trim()
          : typeof payload.key === 'string'
            ? payload.key.trim()
            : typeof media?.publicId === 'string'
              ? media.publicId.trim()
              : typeof media?.key === 'string'
                ? media.key.trim()
                : (payload.mediaPublicId ?? '');

  const mediaTypeRaw = payload.mediaType ?? payload.type;
  const mediaType =
    typeof mediaTypeRaw === 'string' ? mediaTypeRaw.trim().toLowerCase() : mediaTypeRaw;

  return {
    ...payload,
    mediaType,
    mediaUrl,
    mediaPublicId,
    active: payload.active ?? true,
  };
}

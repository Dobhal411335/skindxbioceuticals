import { z } from 'zod';

const siteCodeSchema = z
  .enum(['IN', 'COM', 'in', 'com'])
  .transform((value) => value.toUpperCase() as 'IN' | 'COM');

export const galleryMediaTypeSchema = z.enum(['image', 'video', 'text_card']);

/** Relative paths, hash links, absolute http(s) URLs, or empty. */
const optionalUrlSchema = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (value) => {
      if (value === '' || value === '#') return true;
      if (value.startsWith('/') || value.startsWith('#')) return true;
      try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'URL must be a path, hash link, or absolute http(s) URL' },
  );

const mediaUrlSchema = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (value) => {
      if (value === '') return true;
      if (!z.string().url().safeParse(value).success) return false;
      return value.startsWith('https://') || value.startsWith('http://');
    },
    { message: 'Media URL must be empty or an absolute http(s) URL' },
  );

export const galleryItemBodySchema = z
  .object({
    mediaType: galleryMediaTypeSchema,
    mediaUrl: mediaUrlSchema.default(''),
    mediaPublicId: z.string().trim().max(500).default(''),
    clickUrl: optionalUrlSchema.default(''),
    heading: z.string().trim().max(300).default(''),
    description: z.string().trim().max(4000).default(''),
    buttonLabel: z.string().trim().max(100).default(''),
    buttonUrl: optionalUrlSchema.default(''),
    active: z.boolean().default(true),
  })
  .superRefine((value, ctx) => {
    if (value.mediaType === 'image' || value.mediaType === 'video') {
      if (!value.mediaUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['mediaUrl'],
          message: 'Media URL is required for image and video items',
        });
      }
      return;
    }

    if (!value.heading) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['heading'],
        message: 'Heading is required for text cards',
      });
    }
    if (!value.description) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['description'],
        message: 'Description is required for text cards',
      });
    }
    if (!value.buttonLabel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['buttonLabel'],
        message: 'Button label is required for text cards',
      });
    }
    if (!value.buttonUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['buttonUrl'],
        message: 'Button URL is required for text cards',
      });
    }
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
  let mediaType: unknown = mediaTypeRaw;
  if (typeof mediaTypeRaw === 'string') {
    const normalized = mediaTypeRaw.trim().toLowerCase().replace(/-/g, '_');
    if (normalized === 'text' || normalized === 'textcard' || normalized === 'text_card') {
      mediaType = 'text_card';
    } else {
      mediaType = normalized;
    }
  }

  return {
    ...payload,
    mediaType,
    mediaUrl: mediaUrl ?? '',
    mediaPublicId: mediaPublicId ?? '',
    clickUrl:
      typeof payload.clickUrl === 'string'
        ? payload.clickUrl.trim()
        : (payload.clickUrl ?? ''),
    heading:
      typeof payload.heading === 'string' ? payload.heading.trim() : (payload.heading ?? ''),
    description:
      typeof payload.description === 'string'
        ? payload.description.trim()
        : typeof payload.subDescription === 'string'
          ? payload.subDescription.trim()
          : (payload.description ?? ''),
    buttonLabel:
      typeof payload.buttonLabel === 'string'
        ? payload.buttonLabel.trim()
        : (payload.buttonLabel ?? ''),
    buttonUrl:
      typeof payload.buttonUrl === 'string'
        ? payload.buttonUrl.trim()
        : (payload.buttonUrl ?? ''),
    active: payload.active ?? true,
  };
}

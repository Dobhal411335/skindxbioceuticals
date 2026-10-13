import { z } from 'zod';

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
    { message: 'Image URL must be empty or an absolute http(s) URL' },
  );

export const popupBannerConfigBodySchema = z
  .object({
    imageUrl: mediaUrlSchema.default(''),
    imagePublicId: z.string().trim().max(500).default(''),
    miniHeading: z.string().trim().max(100).default(''),
    heading: z.string().trim().max(300).default(''),
    subDescription: z.string().trim().max(2000).default(''),
    buttonLabel: z.string().trim().max(100).default(''),
    buttonUrl: optionalUrlSchema.default(''),
    active: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (!data.active) return;

    if (!data.imageUrl.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Image is required when the popup is active',
        path: ['imageUrl'],
      });
    }
    if (!data.heading.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Heading is required when the popup is active',
        path: ['heading'],
      });
    }
    if (!data.buttonLabel.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Button label is required when the popup is active',
        path: ['buttonLabel'],
      });
    }
    if (!data.buttonUrl.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Button URL is required when the popup is active',
        path: ['buttonUrl'],
      });
    }
  });

export type PopupBannerConfigBody = z.infer<typeof popupBannerConfigBodySchema>;

/** Normalize loose admin payloads before Zod parse. */
export function normalizePopupBannerConfigInput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const payload = raw as Record<string, unknown>;

  return {
    imageUrl: String(payload.imageUrl ?? '').trim(),
    imagePublicId: String(payload.imagePublicId ?? '').trim(),
    miniHeading: String(payload.miniHeading ?? '').trim(),
    heading: String(payload.heading ?? '').trim(),
    subDescription: String(payload.subDescription ?? '').trim(),
    buttonLabel: String(payload.buttonLabel ?? '').trim(),
    buttonUrl: String(payload.buttonUrl ?? '').trim(),
    active: payload.active ?? false,
  };
}

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

const requiredMediaUrlSchema = mediaUrlSchema.refine((value) => value.length > 0, {
  message: 'Image URL is required',
});

const layoutTypeSchema = z.enum(['FULL_WIDTH', 'SPLIT_DUAL', 'MULTI_IMAGE']);

const gridImageSchema = z.object({
  imageUrl: mediaUrlSchema.refine((value) => value.length > 0, {
    message: 'Grid image URL is required',
  }),
  imagePublicId: z.string().trim().max(500).default(''),
  alt: z.string().trim().max(300).default(''),
  order: z.number().int().min(0).max(10_000).optional(),
});

const sharedMetaFields = {
  order: z.number().int().min(0).max(10_000).optional(),
  active: z.boolean().default(true),
};

/**
 * Full-width: mobile + laptop images.
 * `buttonUrl` is the optional image click destination (no CTA label/copy).
 */
const fullWidthSlideSchema = z.object({
  ...sharedMetaFields,
  layoutType: z.literal('FULL_WIDTH'),
  mobileImageUrl: requiredMediaUrlSchema,
  mobileImagePublicId: z.string().trim().max(500).default(''),
  desktopImageUrl: requiredMediaUrlSchema,
  desktopImagePublicId: z.string().trim().max(500).default(''),
  miniHeading: z.string().trim().max(200).default(''),
  mainHeading: z.string().trim().max(300).default(''),
  description: z.string().trim().max(4000).default(''),
  buttonLabel: z.string().trim().max(100).default(''),
  buttonUrl: optionalUrlSchema.default(''),
  button2Label: z.string().trim().max(100).default(''),
  button2Url: optionalUrlSchema.default(''),
  leftImageUrl: mediaUrlSchema.default(''),
  leftImagePublicId: z.string().trim().max(500).default(''),
  rightImageUrl: mediaUrlSchema.default(''),
  rightImagePublicId: z.string().trim().max(500).default(''),
  gridImages: z.array(gridImageSchema).max(0).default([]),
});

/** Split: copy + dual CTAs + left/right laptop images (no mobile/desktop banner). */
const splitDualSlideSchema = z.object({
  ...sharedMetaFields,
  layoutType: z.literal('SPLIT_DUAL'),
  mobileImageUrl: mediaUrlSchema.default(''),
  mobileImagePublicId: z.string().trim().max(500).default(''),
  desktopImageUrl: mediaUrlSchema.default(''),
  desktopImagePublicId: z.string().trim().max(500).default(''),
  miniHeading: z.string().trim().max(200).default(''),
  mainHeading: z.string().trim().min(1, 'Main heading is required').max(300),
  description: z.string().trim().max(4000).default(''),
  buttonLabel: z.string().trim().min(1, 'Primary button label is required').max(100),
  buttonUrl: optionalUrlSchema.default(''),
  button2Label: z.string().trim().min(1, 'Secondary button label is required').max(100),
  button2Url: optionalUrlSchema.default(''),
  leftImageUrl: requiredMediaUrlSchema,
  leftImagePublicId: z.string().trim().max(500).default(''),
  rightImageUrl: requiredMediaUrlSchema,
  rightImagePublicId: z.string().trim().max(500).default(''),
  gridImages: z.array(gridImageSchema).max(0).default([]),
});

/** Associate brands: copy + CTA + 4–6 grid images (no mobile/desktop banner). */
const multiImageSlideSchema = z.object({
  ...sharedMetaFields,
  layoutType: z.literal('MULTI_IMAGE'),
  mobileImageUrl: mediaUrlSchema.default(''),
  mobileImagePublicId: z.string().trim().max(500).default(''),
  desktopImageUrl: mediaUrlSchema.default(''),
  desktopImagePublicId: z.string().trim().max(500).default(''),
  miniHeading: z.string().trim().max(200).default(''),
  mainHeading: z.string().trim().min(1, 'Main heading is required').max(300),
  description: z.string().trim().max(4000).default(''),
  buttonLabel: z.string().trim().min(1, 'Button label is required').max(100),
  buttonUrl: optionalUrlSchema.default(''),
  button2Label: z.string().trim().max(100).default(''),
  button2Url: optionalUrlSchema.default(''),
  leftImageUrl: mediaUrlSchema.default(''),
  leftImagePublicId: z.string().trim().max(500).default(''),
  rightImageUrl: mediaUrlSchema.default(''),
  rightImagePublicId: z.string().trim().max(500).default(''),
  gridImages: z
    .array(gridImageSchema)
    .min(4, 'Associate brand slides need 4–6 images')
    .max(6, 'Associate brand slides need 4–6 images'),
});

export const heroBannerSlideSchema = z.discriminatedUnion('layoutType', [
  fullWidthSlideSchema,
  splitDualSlideSchema,
  multiImageSlideSchema,
]);

export const heroBannerConfigBodySchema = z.object({
  slides: z.array(heroBannerSlideSchema).max(50).default([]),
});

export type HeroBannerConfigBody = z.infer<typeof heroBannerConfigBodySchema>;
export type HeroBannerSlideBody = z.infer<typeof heroBannerSlideSchema>;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function normalizeGridImages(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      const entry = asRecord(item);
      if (!entry) return null;
      const imageUrl = String(entry.imageUrl ?? entry.url ?? '').trim();
      if (!imageUrl) return null;
      return {
        imageUrl,
        imagePublicId: String(entry.imagePublicId ?? entry.publicId ?? '').trim(),
        alt: String(entry.alt ?? '').trim(),
        order: entry.order ?? index,
      };
    })
    .filter(Boolean);
}

function normalizeLayoutType(raw: unknown): string {
  const value = String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/-/g, '_');
  if (value === 'FULLWIDTH' || value === 'FULL_WIDTH_SINGLE') return 'FULL_WIDTH';
  if (value === 'SPLIT' || value === 'TRIPTYCH' || value === 'SPLIT_DUAL') return 'SPLIT_DUAL';
  if (value === 'MULTI' || value === 'ASSOCIATE' || value === 'MULTI_IMAGE') return 'MULTI_IMAGE';
  return value;
}

/** Normalize slide payloads before Zod parse. */
export function normalizeHeroBannerConfigInput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const payload = raw as Record<string, unknown>;
  const slidesRaw = Array.isArray(payload.slides) ? payload.slides : [];

  const slides = slidesRaw
    .map((item) => {
      const entry = asRecord(item);
      if (!entry) return null;
      const layoutType = normalizeLayoutType(entry.layoutType ?? entry.variant);
      if (!layoutType) return null;

      const mainHeading = String(entry.mainHeading ?? entry.heading ?? '').trim();
      const mobileImageUrl = String(entry.mobileImageUrl ?? '').trim();
      const desktopImageUrl = String(
        entry.desktopImageUrl ?? entry.laptopImageUrl ?? '',
      ).trim();

      // Full-width is image-only; other layouts still need a heading.
      if (layoutType !== 'FULL_WIDTH' && !mainHeading) return null;
      if (layoutType === 'FULL_WIDTH' && !mobileImageUrl && !desktopImageUrl) {
        return null;
      }

      return {
        layoutType,
        order: entry.order,
        active: entry.active ?? true,
        mobileImageUrl,
        mobileImagePublicId: String(entry.mobileImagePublicId ?? '').trim(),
        desktopImageUrl,
        desktopImagePublicId: String(
          entry.desktopImagePublicId ?? entry.laptopImagePublicId ?? '',
        ).trim(),
        miniHeading:
          layoutType === 'FULL_WIDTH'
            ? ''
            : String(entry.miniHeading ?? entry.eyebrow ?? '').trim(),
        mainHeading: layoutType === 'FULL_WIDTH' ? '' : mainHeading,
        description:
          layoutType === 'FULL_WIDTH'
            ? ''
            : String(entry.description ?? entry.subDescription ?? '').trim(),
        buttonLabel:
          layoutType === 'FULL_WIDTH'
            ? ''
            : String(entry.buttonLabel ?? entry.ctaLabel ?? '').trim(),
        buttonUrl: String(
          entry.buttonUrl ?? entry.ctaUrl ?? entry.imageClickUrl ?? '',
        ).trim(),
        button2Label: String(entry.button2Label ?? entry.secondaryButtonLabel ?? '').trim(),
        button2Url: String(entry.button2Url ?? entry.secondaryButtonUrl ?? '').trim(),
        leftImageUrl: String(entry.leftImageUrl ?? '').trim(),
        leftImagePublicId: String(entry.leftImagePublicId ?? '').trim(),
        rightImageUrl: String(entry.rightImageUrl ?? '').trim(),
        rightImagePublicId: String(entry.rightImagePublicId ?? '').trim(),
        gridImages: normalizeGridImages(entry.gridImages ?? entry.images),
      };
    })
    .filter(Boolean);

  return {
    ...payload,
    slides,
  };
}

export { layoutTypeSchema };

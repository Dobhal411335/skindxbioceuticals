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

const aboutCardSchema = z.object({
  imageUrl: mediaUrlSchema.default(''),
  imagePublicId: z.string().trim().max(500).default(''),
  label: z.string().trim().max(100).default(''),
  heading: z.string().trim().min(1, 'Heading is required').max(300),
  description: z.string().trim().min(1, 'Description is required').max(4000),
  buttonLabel: z.string().trim().min(1, 'Button label is required').max(100),
  buttonUrl: optionalUrlSchema.default(''),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
  active: z.boolean().default(true),
});

const highlightItemSchema = z.object({
  imageUrl: mediaUrlSchema.default(''),
  imagePublicId: z.string().trim().max(500).default(''),
  heading: z.string().trim().min(1, 'Heading is required').max(300),
  buttonLabel: z.string().trim().min(1, 'Button label is required').max(100),
  buttonUrl: optionalUrlSchema.default(''),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
  active: z.boolean().default(true),
});

const textSlideSchema = z.object({
  heading: z.string().trim().min(1, 'Heading is required').max(300),
  subheading: z.string().trim().min(1, 'Subheading is required').max(4000),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
  active: z.boolean().default(true),
});

export const aboutUsBannerConfigBodySchema = z.object({
  promoLabel: z.string().trim().max(100).default(''),
  promoHeading: z.string().trim().max(300).default(''),
  promoSubheading: z.string().trim().max(1000).default(''),
  promoButtonLabel: z.string().trim().max(100).default(''),
  promoButtonUrl: optionalUrlSchema.default(''),
  aboutCards: z.array(aboutCardSchema).max(50).default([]),
  highlightItems: z.array(highlightItemSchema).max(50).default([]),
  textSlides: z.array(textSlideSchema).max(50).default([]),
});

export type AboutUsBannerConfigBody = z.infer<typeof aboutUsBannerConfigBodySchema>;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function normalizeAboutCards(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const entry = asRecord(item);
      if (!entry) return null;
      const heading = String(entry.heading ?? '').trim();
      const description = String(entry.description ?? '').trim();
      const buttonLabel = String(entry.buttonLabel ?? '').trim();
      if (!heading || !description || !buttonLabel) return null;
      return {
        imageUrl: String(entry.imageUrl ?? '').trim(),
        imagePublicId: String(entry.imagePublicId ?? '').trim(),
        label: String(entry.label ?? '').trim(),
        heading,
        description,
        buttonLabel,
        buttonUrl: String(entry.buttonUrl ?? '').trim(),
        sortOrder: entry.sortOrder,
        active: entry.active ?? true,
      };
    })
    .filter(Boolean);
}

function normalizeHighlightItems(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const entry = asRecord(item);
      if (!entry) return null;
      const heading = String(entry.heading ?? '').trim();
      const buttonLabel = String(entry.buttonLabel ?? '').trim();
      if (!heading || !buttonLabel) return null;
      return {
        imageUrl: String(entry.imageUrl ?? '').trim(),
        imagePublicId: String(entry.imagePublicId ?? '').trim(),
        heading,
        buttonLabel,
        buttonUrl: String(entry.buttonUrl ?? '').trim(),
        sortOrder: entry.sortOrder,
        active: entry.active ?? true,
      };
    })
    .filter(Boolean);
}

function normalizeTextSlides(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const entry = asRecord(item);
      if (!entry) return null;
      const heading = String(entry.heading ?? '').trim();
      const subheading = String(entry.subheading ?? '').trim();
      if (!heading || !subheading) return null;
      return {
        heading,
        subheading,
        sortOrder: entry.sortOrder,
        active: entry.active ?? true,
      };
    })
    .filter(Boolean);
}

/** Normalize nested arrays before Zod parse. */
export function normalizeAboutUsBannerConfigInput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const payload = raw as Record<string, unknown>;

  return {
    ...payload,
    promoLabel: String(payload.promoLabel ?? '').trim(),
    promoHeading: String(payload.promoHeading ?? '').trim(),
    promoSubheading: String(payload.promoSubheading ?? '').trim(),
    promoButtonLabel: String(payload.promoButtonLabel ?? '').trim(),
    promoButtonUrl: String(payload.promoButtonUrl ?? '').trim(),
    aboutCards: normalizeAboutCards(payload.aboutCards),
    highlightItems: normalizeHighlightItems(payload.highlightItems),
    textSlides: normalizeTextSlides(payload.textSlides),
  };
}

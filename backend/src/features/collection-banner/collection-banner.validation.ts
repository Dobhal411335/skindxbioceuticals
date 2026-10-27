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

const collectionBannerItemSchema = z.object({
  imageUrl: mediaUrlSchema.default(''),
  imagePublicId: z.string().trim().max(500).default(''),
  title: z.string().trim().min(1, 'Title is required').max(300),
  description: z.string().trim().max(4000).default(''),
  buttonUrl: optionalUrlSchema.default(''),
  button1Label: z.string().trim().max(80).default(''),
  button1Url: optionalUrlSchema.default(''),
  button2Label: z.string().trim().max(80).default(''),
  button2Url: optionalUrlSchema.default(''),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
  active: z.boolean().default(true),
});

export const collectionBannerConfigBodySchema = z.object({
  sectionLabel: z.string().trim().max(100).default(''),
  sectionHeading: z.string().trim().max(300).default(''),
  items: z.array(collectionBannerItemSchema).max(50).default([]),
});

type CollectionBannerItemBody = Omit<
  z.infer<typeof collectionBannerItemSchema>,
  'button1Label' | 'button1Url' | 'button2Label' | 'button2Url'
> &
  Partial<
    Pick<
      z.infer<typeof collectionBannerItemSchema>,
      'button1Label' | 'button1Url' | 'button2Label' | 'button2Url'
    >
  >;

export type CollectionBannerConfigBody = Omit<
  z.infer<typeof collectionBannerConfigBodySchema>,
  'items'
> & { items: CollectionBannerItemBody[] };

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function normalizeItems(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const entry = asRecord(item);
      if (!entry) return null;
      const title = String(entry.title ?? '').trim();
      if (!title) return null;
      return {
        imageUrl: String(entry.imageUrl ?? '').trim(),
        imagePublicId: String(entry.imagePublicId ?? '').trim(),
        title,
        description: String(entry.description ?? '').trim(),
        buttonUrl: String(entry.buttonUrl ?? '').trim(),
        button1Label: String(entry.button1Label ?? '').trim(),
        button1Url: String(entry.button1Url ?? '').trim(),
        button2Label: String(entry.button2Label ?? '').trim(),
        button2Url: String(entry.button2Url ?? '').trim(),
        sortOrder: entry.sortOrder,
        active: entry.active ?? true,
      };
    })
    .filter(Boolean);
}

/** Normalize nested arrays before Zod parse. */
export function normalizeCollectionBannerConfigInput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const payload = raw as Record<string, unknown>;
  return {
    ...payload,
    sectionLabel: String(payload.sectionLabel ?? '').trim(),
    sectionHeading: String(payload.sectionHeading ?? '').trim(),
    items: normalizeItems(payload.items),
  };
}

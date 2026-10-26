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

const promoBannerItemSchema = z.object({
  miniHeading: z.string().trim().max(120).default(''),
  heading: z.string().trim().max(200).default(''),
  description: z.string().trim().max(500).default(''),
  buttonLabel: z.string().trim().max(80).default(''),
  buttonUrl: optionalUrlSchema.default(''),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
  active: z.boolean().default(true),
});

export const promoBannerConfigBodySchema = z.object({
  items: z.array(promoBannerItemSchema).max(50).default([]),
});

export type PromoBannerConfigBody = z.infer<typeof promoBannerConfigBodySchema>;

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
      const miniHeading = String(entry.miniHeading ?? '').trim();
      const heading = String(entry.heading ?? '').trim();
      const description = String(entry.description ?? '').trim();
      const buttonLabel = String(entry.buttonLabel ?? '').trim();
      const buttonUrl = String(entry.buttonUrl ?? '').trim();
      // Skip empty placeholder rows with neither media nor copy.
      if (
        !miniHeading &&
        !heading &&
        !description &&
        !buttonLabel &&
        !buttonUrl
      ) {
        return null;
      }
      return {
        miniHeading,
        heading,
        description,
        buttonLabel,
        buttonUrl,
        sortOrder: entry.sortOrder,
        active: entry.active ?? true,
      };
    })
    .filter(Boolean);
}

/** Normalize nested arrays before Zod parse. */
export function normalizePromoBannerConfigInput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const payload = raw as Record<string, unknown>;
  return {
    ...payload,
    items: normalizeItems(payload.items),
  };
}

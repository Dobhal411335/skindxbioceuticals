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
      return z.string().url().safeParse(value).success;
    },
    { message: 'URL must be a path, hash link, or absolute URL' },
  );

const announcementItemSchema = z.object({
  text: z.string().trim().min(1, 'Announcement text is required').max(500),
  url: optionalUrlSchema.default(''),
  active: z.boolean().default(true),
});

const utilityItemSchema = z.object({
  text: z.string().trim().min(1, 'Utility text is required').max(300),
  url: optionalUrlSchema.default(''),
  active: z.boolean().default(true),
});

const benefitItemSchema = z.object({
  text: z.string().trim().min(1, 'Benefit title is required').max(200),
  url: optionalUrlSchema.default(''),
  active: z.boolean().default(true),
});

export const topAdvertisementConfigBodySchema = z.object({
  announcements: z.array(announcementItemSchema).max(50).default([]),
  utilityItems: z.array(utilityItemSchema).max(20).default([]),
  benefits: z.array(benefitItemSchema).max(20).default([]),
});

export type TopAdvertisementConfigBody = z.infer<
  typeof topAdvertisementConfigBodySchema
>;

function normalizeItemList(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const entry = item as Record<string, unknown>;
      const text = String(entry.text ?? '').trim();
      if (!text) return null;

      return {
        text,
        url: String(entry.url ?? '').trim(),
        active: entry.active ?? true,
      };
    })
    .filter(Boolean);
}

/** Normalize section arrays before Zod parse. */
export function normalizeTopAdvertisementConfigInput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const payload = raw as Record<string, unknown>;

  return {
    ...payload,
    announcements: normalizeItemList(payload.announcements),
    utilityItems: normalizeItemList(payload.utilityItems),
    benefits: normalizeItemList(payload.benefits),
  };
}

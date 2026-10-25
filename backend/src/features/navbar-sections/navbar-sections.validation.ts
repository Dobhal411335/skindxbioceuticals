import { z } from 'zod';

/** Relative paths, hash links, or absolute http(s) URLs. */
const navUrlSchema = z
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

const subSectionSchema = z.object({
  title: z.string().trim().min(1, 'Sub-section title is required').max(200),
  url: navUrlSchema.default('#'),
  description: z.string().trim().max(500).default(''),
  active: z.boolean().default(true),
  order: z.coerce.number().int().min(0).max(10_000).default(0),
});

export const navbarSectionBodySchema = z.object({
  title: z.string().trim().min(1, 'Section title is required').max(200),
  url: navUrlSchema.default('#'),
  menuHeading: z.string().trim().max(300).default(''),
  menuDescription: z.string().trim().max(500).default(''),
  active: z.boolean().default(true),
  order: z.coerce.number().int().min(0).max(10_000).optional(),
  subSections: z.array(subSectionSchema).max(50).default([]),
});

export const navbarSectionPatchSchema = z.object({
  active: z.boolean(),
});

export const navbarSectionIdParamSchema = z.object({
  siteCode: z.enum(['IN', 'COM', 'in', 'com']).transform((value) => value.toUpperCase() as 'IN' | 'COM'),
  sectionId: z.string().uuid(),
});

export type NavbarSectionBody = z.infer<typeof navbarSectionBodySchema>;
export type NavbarSectionPatchBody = z.infer<typeof navbarSectionPatchSchema>;

export function normalizeNavbarSectionInput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const payload = raw as Record<string, unknown>;
  const subSections = Array.isArray(payload.subSections)
    ? payload.subSections
        .filter((item) => item && typeof item === 'object')
        .map((item, index) => {
          const sub = item as Record<string, unknown>;
          const title = String(sub.title ?? '').trim();
          if (!title) return null;
          return {
            title,
            url: String(sub.url ?? '#').trim() || '#',
            description: String(sub.description ?? '').trim(),
            active: sub.active ?? true,
            order:
              sub.order === '' || sub.order === undefined || sub.order === null
                ? index + 1
                : Number(sub.order),
          };
        })
        .filter(Boolean)
    : [];

  return {
    ...payload,
    title: typeof payload.title === 'string' ? payload.title.trim() : payload.title,
    url:
      typeof payload.url === 'string'
        ? payload.url.trim() || '#'
        : payload.url === undefined || payload.url === null
          ? '#'
          : payload.url,
    menuHeading: String(payload.menuHeading ?? payload.dropdownHeading ?? '').trim(),
    menuDescription: String(payload.menuDescription ?? payload.dropdownDescription ?? '').trim(),
    active: payload.active ?? true,
    order:
      payload.order === '' || payload.order === undefined || payload.order === null
        ? undefined
        : Number(payload.order),
    subSections,
  };
}

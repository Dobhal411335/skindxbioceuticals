import { z } from 'zod';

/** Relative paths, hash links, or absolute http(s) URLs. */
const footerUrlSchema = z
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

const footerLinkSchema = z.object({
  label: z.string().trim().min(1, 'Link label is required').max(200),
  url: footerUrlSchema.default('#'),
  active: z.boolean().default(true),
  order: z.coerce.number().int().min(0).max(10_000).default(0),
});

const footerColumnSchema = z.object({
  title: z.string().trim().min(1, 'Column title is required').max(200),
  active: z.boolean().default(true),
  order: z.coerce.number().int().min(0).max(10_000).default(0),
  links: z.array(footerLinkSchema).max(50).default([]),
});

export const footerConfigBodySchema = z.object({
  thankYou: z.string().trim().max(300).default(''),
  description: z.string().trim().max(5000).default(''),
  columns: z.array(footerColumnSchema).max(20).default([]),
});

export type FooterConfigBody = z.infer<typeof footerConfigBodySchema>;

/** Normalize nested arrays before Zod parse. */
export function normalizeFooterConfigInput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const payload = raw as Record<string, unknown>;

  const columns = Array.isArray(payload.columns)
    ? payload.columns
        .filter((item) => item && typeof item === 'object')
        .map((item, columnIndex) => {
          const column = item as Record<string, unknown>;
          const title = String(column.title ?? '').trim();
          if (!title) return null;

          const links = Array.isArray(column.links)
            ? column.links
                .filter((link) => link && typeof link === 'object')
                .map((link, linkIndex) => {
                  const entry = link as Record<string, unknown>;
                  const label = String(entry.label ?? '').trim();
                  if (!label) return null;
                  return {
                    label,
                    url: String(entry.url ?? '#').trim() || '#',
                    active: entry.active ?? true,
                    order:
                      entry.order === '' ||
                      entry.order === undefined ||
                      entry.order === null
                        ? linkIndex + 1
                        : Number(entry.order),
                  };
                })
                .filter(Boolean)
            : [];

          return {
            title,
            active: column.active ?? true,
            order:
              column.order === '' ||
              column.order === undefined ||
              column.order === null
                ? columnIndex + 1
                : Number(column.order),
            links,
          };
        })
        .filter(Boolean)
    : [];

  return {
    ...payload,
    thankYou: String(payload.thankYou ?? '').trim(),
    description: String(payload.description ?? '').trim(),
    columns,
  };
}

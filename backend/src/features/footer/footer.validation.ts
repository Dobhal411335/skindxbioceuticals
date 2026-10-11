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

const absoluteUrlSchema = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => z.string().url().safeParse(value).success, {
    message: 'Invalid URL',
  });

const imageRefSchema = z.object({
  url: z.string().trim().max(2000).default(''),
  publicId: z.string().trim().max(500).default(''),
});

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

const footerSocialLinkSchema = z.object({
  label: z.string().trim().min(1, 'Social label is required').max(100),
  url: absoluteUrlSchema,
  iconKey: z.string().trim().max(50).default(''),
  active: z.boolean().default(true),
  order: z.coerce.number().int().min(0).max(10_000).default(0),
});

export const footerConfigBodySchema = z.object({
  thankYou: z.string().trim().max(300).default(''),
  description: z.string().trim().max(5000).default(''),
  logo: imageRefSchema.default({ url: '', publicId: '' }),
  columns: z.array(footerColumnSchema).max(20).default([]),
  socialLinks: z.array(footerSocialLinkSchema).max(20).default([]),
});

export type FooterConfigBody = z.infer<typeof footerConfigBodySchema>;

/** Normalize nested arrays/images before Zod parse. */
export function normalizeFooterConfigInput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const payload = raw as Record<string, unknown>;

  const normalizeImage = (value: unknown) => {
    if (!value || typeof value !== 'object') {
      return { url: '', publicId: '' };
    }
    const image = value as Record<string, unknown>;
    return {
      url: String(image.url ?? '').trim(),
      publicId: String(image.publicId ?? image.key ?? '').trim(),
    };
  };

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

  const socialLinks = Array.isArray(payload.socialLinks)
    ? payload.socialLinks
        .filter((item) => item && typeof item === 'object')
        .map((item, index) => {
          const social = item as Record<string, unknown>;
          const label = String(social.label ?? '').trim();
          const url = String(social.url ?? '').trim();
          if (!label || !url) return null;
          return {
            label,
            url,
            iconKey: String(social.iconKey ?? social.platform ?? '').trim().toLowerCase(),
            active: social.active ?? true,
            order:
              social.order === '' ||
              social.order === undefined ||
              social.order === null
                ? index + 1
                : Number(social.order),
          };
        })
        .filter(Boolean)
    : [];

  return {
    ...payload,
    thankYou: String(payload.thankYou ?? '').trim(),
    description: String(payload.description ?? '').trim(),
    logo: normalizeImage(payload.logo),
    columns,
    socialLinks,
  };
}

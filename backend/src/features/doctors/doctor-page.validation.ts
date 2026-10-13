import { z } from 'zod';
import { DOCTOR_SERVICE_ICON_KEYS } from './doctors.constants';

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

const serviceItemSchema = z.object({
  iconKey: z.enum(DOCTOR_SERVICE_ICON_KEYS),
  name: z.string().trim().min(1, 'Service name is required').max(160),
  description: z.string().trim().min(1, 'Service description is required').max(1000),
  readMoreUrl: optionalUrlSchema.default(''),
  order: z.number().int().min(0).max(10_000).optional(),
  active: z.boolean().default(true),
});

export const doctorPageConfigBodySchema = z.object({
  aboutHeading: z.string().trim().max(300).default(''),
  aboutDescription: z.string().trim().max(4000).default(''),
  aboutHighlights: z
    .array(z.string().trim().min(1).max(200))
    .max(20)
    .default([]),
  aboutButtonLabel: z.string().trim().max(100).default(''),
  aboutButtonUrl: optionalUrlSchema.default(''),
  aboutImageUrl: mediaUrlSchema.default(''),
  aboutImagePublicId: z.string().trim().max(500).default(''),
  aboutSecondaryImageUrl: mediaUrlSchema.default(''),
  aboutSecondaryImagePublicId: z.string().trim().max(500).default(''),
  experienceYears: z.coerce.number().int().min(0).max(100).nullable().optional(),
  servicesHeading: z.string().trim().max(300).default(''),
  servicesSubheading: z.string().trim().max(2000).default(''),
  services: z.array(serviceItemSchema).max(40).default([]),
});

export type DoctorPageConfigBody = z.infer<typeof doctorPageConfigBodySchema>;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function normalizeHighlights(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
}

function normalizeServices(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const entry = asRecord(item);
      if (!entry) return null;
      const name = String(entry.name ?? '').trim();
      const description = String(entry.description ?? '').trim();
      const iconKey = String(entry.iconKey ?? entry.icon ?? '').trim();
      if (!name || !description || !iconKey) return null;
      return {
        iconKey,
        name,
        description,
        readMoreUrl: String(entry.readMoreUrl ?? entry.url ?? '').trim(),
        order: entry.order,
        active: entry.active ?? true,
      };
    })
    .filter(Boolean);
}

function resolveMediaUrl(
  payload: Record<string, unknown>,
  keys: string[],
  nestedKeys: string[],
): string | undefined {
  for (const key of keys) {
    if (typeof payload[key] === 'string') {
      return (payload[key] as string).trim();
    }
  }
  for (const nestedKey of nestedKeys) {
    const nested = asRecord(payload[nestedKey]);
    if (!nested) continue;
    if (typeof nested.secureUrl === 'string') return nested.secureUrl.trim();
    if (typeof nested.url === 'string') return nested.url.trim();
  }
  return undefined;
}

function resolvePublicId(
  payload: Record<string, unknown>,
  keys: string[],
  nestedKeys: string[],
): string | undefined {
  for (const key of keys) {
    if (typeof payload[key] === 'string') {
      return (payload[key] as string).trim();
    }
  }
  for (const nestedKey of nestedKeys) {
    const nested = asRecord(payload[nestedKey]);
    if (!nested) continue;
    if (typeof nested.publicId === 'string') return nested.publicId.trim();
  }
  return undefined;
}

export function normalizeDoctorPageConfigInput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const payload = raw as Record<string, unknown>;

  const aboutImageUrl =
    resolveMediaUrl(payload, ['aboutImageUrl', 'imageUrl'], ['aboutImage', 'image']) ??
    payload.aboutImageUrl;
  const aboutImagePublicId =
    resolvePublicId(
      payload,
      ['aboutImagePublicId', 'imagePublicId'],
      ['aboutImage', 'image'],
    ) ?? payload.aboutImagePublicId;

  const aboutSecondaryImageUrl =
    resolveMediaUrl(
      payload,
      ['aboutSecondaryImageUrl', 'secondaryImageUrl'],
      ['aboutSecondaryImage', 'secondaryImage'],
    ) ?? payload.aboutSecondaryImageUrl;
  const aboutSecondaryImagePublicId =
    resolvePublicId(
      payload,
      ['aboutSecondaryImagePublicId', 'secondaryImagePublicId'],
      ['aboutSecondaryImage', 'secondaryImage'],
    ) ?? payload.aboutSecondaryImagePublicId;

  const experienceYears =
    payload.experienceYears === '' || payload.experienceYears === undefined
      ? null
      : payload.experienceYears === null
        ? null
        : Number(payload.experienceYears);

  return {
    ...payload,
    aboutHeading:
      typeof payload.aboutHeading === 'string'
        ? payload.aboutHeading.trim()
        : typeof payload.heading === 'string'
          ? payload.heading.trim()
          : payload.aboutHeading,
    aboutDescription:
      typeof payload.aboutDescription === 'string'
        ? payload.aboutDescription.trim()
        : typeof payload.description === 'string'
          ? payload.description.trim()
          : payload.aboutDescription,
    aboutHighlights: normalizeHighlights(
      payload.aboutHighlights ?? payload.highlights,
    ),
    aboutButtonLabel:
      typeof payload.aboutButtonLabel === 'string'
        ? payload.aboutButtonLabel.trim()
        : typeof payload.buttonLabel === 'string'
          ? payload.buttonLabel.trim()
          : payload.aboutButtonLabel,
    aboutButtonUrl:
      typeof payload.aboutButtonUrl === 'string'
        ? payload.aboutButtonUrl.trim()
        : typeof payload.buttonUrl === 'string'
          ? payload.buttonUrl.trim()
          : payload.aboutButtonUrl,
    aboutImageUrl,
    aboutImagePublicId,
    aboutSecondaryImageUrl,
    aboutSecondaryImagePublicId,
    experienceYears,
    servicesHeading:
      typeof payload.servicesHeading === 'string'
        ? payload.servicesHeading.trim()
        : payload.servicesHeading,
    servicesSubheading:
      typeof payload.servicesSubheading === 'string'
        ? payload.servicesSubheading.trim()
        : payload.servicesSubheading,
    services: normalizeServices(payload.services),
  };
}

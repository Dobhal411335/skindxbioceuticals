import { z } from 'zod';
import { WEBPAGE_TEMPLATE_TYPES } from './webpage.types';

const siteCodeSchema = z
  .enum(['IN', 'COM', 'in', 'com'])
  .transform((value) => value.toUpperCase() as 'IN' | 'COM');

const slugSchema = z
  .string()
  .trim()
  .min(1, 'Slug is required')
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens');

/** Empty / whitespace slug is treated as omitted (no slug change). */
const optionalSlugSchema = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed.toLowerCase();
}, slugSchema.optional());

export const webpageTemplateTypeSchema = z.enum(WEBPAGE_TEMPLATE_TYPES);

const imageAssetSchema = z
  .object({
    url: z.string().trim().max(5000).default(''),
    key: z.string().trim().max(1000).default(''),
  })
  .passthrough()
  .nullable()
  .optional();

export const webpageCreateBodySchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300),
  slug: slugSchema.optional(),
  active: z.boolean().default(true),
  templateType: webpageTemplateTypeSchema.default('design1'),
});

export const webpageMetaPatchBodySchema = z
  .object({
    title: z.string().trim().min(1).max(300).optional(),
    slug: slugSchema.optional(),
    active: z.boolean().optional(),
    templateType: webpageTemplateTypeSchema.optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.slug !== undefined ||
      value.active !== undefined ||
      value.templateType !== undefined,
    { message: 'At least one field is required' },
  );

/** Full content update — permissive Json for nested CMS structures; scalars typed. */
export const webpageContentPatchBodySchema = z.object({
  title: z.string().optional(),
  slug: optionalSlugSchema,
  active: z.boolean().optional(),
  templateType: webpageTemplateTypeSchema.optional(),
  titleLine: z.string().optional(),
  keywords: z.array(z.string().optional()).optional(),
  firstTitle: z.string().optional(),
  secondTitle: z.string().optional(),
  imageFirst: imageAssetSchema,
  imageFirstMobile: imageAssetSchema,
  bannerImage: imageAssetSchema,
  bannerImageMobile: imageAssetSchema,
  paragraphFirstImage: imageAssetSchema,
  paragraphSecondImage: imageAssetSchema,
  advertisementImage: imageAssetSchema,
  sideThumbImage: imageAssetSchema,
  mainProfileImage: imageAssetSchema,
  createTags: z.unknown().optional(),
  postedBy: z.unknown().optional(),
  highlights: z.unknown().optional(),
  paragraphSections: z.unknown().optional(),
  tableTitle: z.string().optional(),
  tableRows: z.unknown().optional(),
  blockquoteMainTitle: z.string().optional(),
  blockquoteLeftTitle: z.string().optional(),
  blockquoteDescription: z.string().optional(),
  blockquoteTags: z.unknown().optional(),
  accordionTags: z.unknown().optional(),
  advertisements: z.unknown().optional(),
  advertisementUrl: z.string().optional(),
  sideThumbName: z.string().optional(),
  sideThumbDesignation: z.string().optional(),
  sideThumbDescription: z.string().optional(),
  facebookUrl: z.string().optional(),
  youtubeUrl: z.string().optional(),
  instaUrl: z.string().optional(),
  googleUrl: z.string().optional(),
  imageGallery: z.unknown().optional(),
  notices: z.unknown().optional(),
  searchLocations: z.unknown().optional(),
  design5Chip: z.string().optional(),
  design5MainHeading: z.string().optional(),
  gridCards: z.unknown().optional(),
  design6Chip: z.string().optional(),
  design6ExploreLink: z.string().optional(),
  design6MainHeading: z.string().optional(),
  design6SubHeading: z.string().optional(),
  design6Author: z.string().optional(),
  design6MidHeading: z.string().optional(),
  design6MidLink: z.string().optional(),
  teamCards: z.unknown().optional(),
  design7Chip: z.string().optional(),
  design7ExploreLink: z.string().optional(),
  design7MainHeading: z.string().optional(),
  design9MiniHeading: z.string().optional(),
  design9MainHeading: z.string().optional(),
  design9Description: z.string().optional(),
  design9Cards: z.unknown().optional(),
});

export const webpageIdParamSchema = z.object({
  siteCode: siteCodeSchema,
  webpageId: z.string().uuid(),
});

export const webpageSlugParamSchema = z.object({
  siteCode: siteCodeSchema,
  slug: slugSchema,
});

export type WebpageCreateBody = z.infer<typeof webpageCreateBodySchema>;
export type WebpageMetaPatchBody = z.infer<typeof webpageMetaPatchBodySchema>;
export type WebpageContentPatchBody = z.infer<typeof webpageContentPatchBodySchema>;

export function normalizeWebpageCreateInput(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const payload = { ...(body as Record<string, unknown>) };
  if (typeof payload.templateType === 'string') {
    payload.templateType = payload.templateType.trim().toLowerCase();
  }
  if (typeof payload.slug === 'string') {
    payload.slug = payload.slug.trim().toLowerCase();
  }
  return payload;
}

export function normalizeWebpageContentInput(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const payload = { ...(body as Record<string, unknown>) };
  if (typeof payload.templateType === 'string') {
    payload.templateType = payload.templateType.trim().toLowerCase();
  }
  if (typeof payload.slug === 'string') {
    payload.slug = payload.slug.trim().toLowerCase();
  }
  // Hotel sometimes sends sideThumbImage as URL string
  if (typeof payload.sideThumbImage === 'string') {
    payload.sideThumbImage = {
      url: payload.sideThumbImage,
      key: typeof payload.sideThumbImageKey === 'string' ? payload.sideThumbImageKey : '',
    };
  }
  // Normalize image objects that use publicId instead of key
  for (const key of [
    'imageFirst',
    'imageFirstMobile',
    'bannerImage',
    'bannerImageMobile',
    'paragraphFirstImage',
    'paragraphSecondImage',
    'advertisementImage',
    'sideThumbImage',
    'mainProfileImage',
  ]) {
    const value = payload[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const img = value as Record<string, unknown>;
      payload[key] = {
        url:
          typeof img.url === 'string'
            ? img.url
            : typeof img.secureUrl === 'string'
              ? img.secureUrl
              : '',
        key:
          typeof img.key === 'string'
            ? img.key
            : typeof img.publicId === 'string'
              ? img.publicId
              : '',
      };
    }
  }
  return payload;
}

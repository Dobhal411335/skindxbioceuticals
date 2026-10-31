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
  design10HeroMiniHeading: z.string().optional(), design10HeroMainHeading: z.string().optional(), design10HeroDescription: z.string().optional(), design10HeroImage: imageAssetSchema,
  design10StoryMiniHeading: z.string().optional(), design10StoryDescription: z.string().optional(), design10StoryParagraph: z.string().optional(), design10StorySmallParagraph: z.string().optional(),
  design10DefineMiniHeading: z.string().optional(), design10DefineCards: z.unknown().optional(),
  design10JourneyMiniHeading: z.string().optional(), design10JourneyMainHeading: z.string().optional(), design10JourneyImage: imageAssetSchema, design10JourneyTimeline: z.unknown().optional(),
  design10LeadershipMiniHeading: z.string().optional(), design10LeadershipMainHeading: z.string().optional(), design10LeadershipCards: z.unknown().optional(),
  design10GlobalMiniHeading: z.string().optional(), design10GlobalMainHeading: z.string().optional(), design10GlobalDescription: z.string().optional(), design10GlobalCards: z.unknown().optional(), design10GlobalImage: imageAssetSchema,
  design10ExploreMiniHeading: z.string().optional(), design10ExploreMainHeading: z.string().optional(), design10ExploreCards: z.unknown().optional(),
  design11HeroMiniHeading: z.string().optional(), design11HeroMainHeading: z.string().optional(), design11HeroDescription: z.string().optional(), design11HeroImage: imageAssetSchema,
  design11CapabilitiesMiniHeading: z.string().optional(), design11CapabilitiesMainHeading: z.string().optional(), design11CapabilitiesDescription: z.string().optional(), design11CapabilitiesCards: z.unknown().optional(),
  design11ProcessMiniHeading: z.string().optional(), design11ProcessMainHeading: z.string().optional(), design11ProcessDescription: z.string().optional(), design11ProcessCards: z.unknown().optional(),
  design11EngagementMiniHeading: z.string().optional(), design11EngagementMainHeading: z.string().optional(), design11EngagementCards: z.unknown().optional(),
  design11FaqMiniHeading: z.string().optional(), design11FaqMainHeading: z.string().optional(), design11FaqDescription: z.string().optional(), design11FaqItems: z.unknown().optional(),
  design11ExploreMiniHeading: z.string().optional(), design11ExploreMainHeading: z.string().optional(), design11ExploreCards: z.unknown().optional(),
  design12HeroMiniHeading: z.string().optional(), design12HeroMainHeading: z.string().optional(), design12HeroDescription: z.string().optional(), design12HeroImage: imageAssetSchema,
  design12ChallengeMiniHeading: z.string().optional(), design12ChallengeMainHeading: z.string().optional(), design12ChallengeDescription: z.string().optional(), design12ChallengeCard: z.unknown().optional(),
  design12HelpMiniHeading: z.string().optional(), design12HelpMainHeading: z.string().optional(), design12HelpCards: z.unknown().optional(),
  design12MethodologyMiniHeading: z.string().optional(), design12MethodologyMainHeading: z.string().optional(), design12MethodologyDescription: z.string().optional(), design12MethodologyCards: z.unknown().optional(),
  design12OutcomesMiniHeading: z.string().optional(), design12OutcomesMainHeading: z.string().optional(), design12OutcomeCards: z.unknown().optional(),
  design12RelatedMiniHeading: z.string().optional(), design12RelatedMainHeading: z.string().optional(), design12RelatedCards: z.unknown().optional(),
  design12ExploreMiniHeading: z.string().optional(), design12ExploreMainHeading: z.string().optional(), design12ExploreCards: z.unknown().optional(),
  design13HeroMiniHeading: z.string().optional(), design13HeroMainHeading: z.string().optional(), design13HeroDescription: z.string().optional(), design13HeroImage: imageAssetSchema,
  design13ProcessMiniHeading: z.string().optional(), design13ProcessMainHeading: z.string().optional(), design13ProcessTimeline: z.unknown().optional(),
  design13FaqMiniHeading: z.string().optional(), design13FaqMainHeading: z.string().optional(), design13FaqItems: z.unknown().optional(),
  design13ExploreMiniHeading: z.string().optional(), design13ExploreMainHeading: z.string().optional(), design13ExploreCards: z.unknown().optional(),
  design14HeroMiniHeading: z.string().optional(), design14HeroMainHeading: z.string().optional(), design14HeroDescription: z.string().optional(), design14HeroImage: imageAssetSchema,
  design14SectorsMiniHeading: z.string().optional(), design14SectorsMainHeading: z.string().optional(), design14SectorsDescription: z.string().optional(), design14SectorCards: z.unknown().optional(),
  design14PerspectiveMiniHeading: z.string().optional(), design14PerspectiveMainHeading: z.string().optional(), design14PerspectiveDescription: z.string().optional(), design14PerspectiveCards: z.unknown().optional(),
  design14QuestionsMiniHeading: z.string().optional(), design14QuestionsMainHeading: z.string().optional(), design14QuestionsDescription: z.string().optional(), design14QuestionCards: z.unknown().optional(),
  design14Quote: z.string().optional(), design14QuoteDesignation: z.string().optional(), design14ExploreMiniHeading: z.string().optional(), design14ExploreMainHeading: z.string().optional(), design14ExploreCards: z.unknown().optional(),
  design15HeroMiniHeading: z.string().optional(), design15HeroMainHeading: z.string().optional(), design15HeroDescription: z.string().optional(), design15NoticeMiniHeading: z.string().optional(), design15NoticeMainHeading: z.string().optional(), design15NoticeDescription: z.string().optional(), design15FaqItems: z.unknown().optional(), design15ExploreCards: z.unknown().optional(),
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

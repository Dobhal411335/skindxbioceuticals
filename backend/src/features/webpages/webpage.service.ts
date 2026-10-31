import type { Prisma } from '@prisma/client';
import { deleteStoredCloudinaryAssetBestEffort } from '@/lib/cloudinary';
import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { ConflictError, NotFoundError, ValidationError } from '@/utils/AppError';
import { webpageRepository } from './webpage.repository';
import type {
  WebpageDto,
  WebpageImageAsset,
  WebpageListDto,
  WebpagePublicDto,
  WebpageRecord,
  WebpageTemplateType,
} from './webpage.types';
import { WEBPAGE_TEMPLATE_TYPES } from './webpage.types';
import type {
  WebpageContentPatchBody,
  WebpageCreateBody,
  WebpageMetaPatchBody,
} from './webpage.validation';

type JsonImageInput = Prisma.InputJsonValue;

/** Storefront static route segments that must not be claimed by CMS pages. */
export const RESERVED_WEBPAGE_SLUGS = new Set([
  'about',
  'account',
  'become-vendor',
  'blog',
  'cart',
  'category',
  'checkout',
  'contact',
  'doctors',
  'faq',
  'products',
  'vendor',
  'wishlist',
  'api',
  'admin',
]);

function preferHttpsUrl(url: string): string {
  if (url.startsWith('http://res.cloudinary.com/')) {
    return `https://${url.slice('http://'.length)}`;
  }
  return url;
}

function asTemplateType(value: string): WebpageTemplateType {
  if ((WEBPAGE_TEMPLATE_TYPES as readonly string[]).includes(value)) {
    return value as WebpageTemplateType;
  }
  return 'design1';
}

function asImageAsset(value: Prisma.JsonValue | null | undefined): WebpageImageAsset | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const obj = value as Record<string, unknown>;
  const url = typeof obj.url === 'string' ? preferHttpsUrl(obj.url) : '';
  const key = typeof obj.key === 'string' ? obj.key : '';
  if (!url && !key) return null;
  return { url, key };
}

function emptyImage(): WebpageImageAsset {
  return { url: '', key: '' };
}

function normalizeImageInput(
  value: { url?: string; key?: string } | null | undefined,
): JsonImageInput | undefined {
  if (value === undefined) return undefined;
  if (value === null) return { url: '', key: '' };
  return {
    url: preferHttpsUrl(String(value.url || '').trim()),
    key: String(value.key || '').trim(),
  };
}

function collectPublicIds(record: WebpageRecord): string[] {
  const keys = new Set<string>();
  const pushAsset = (asset: Prisma.JsonValue | null) => {
    const parsed = asImageAsset(asset);
    if (parsed?.key) keys.add(parsed.key);
  };
  pushAsset(record.imageFirst);
  pushAsset(record.imageFirstMobile);
  pushAsset(record.bannerImage);
  pushAsset(record.bannerImageMobile);
  pushAsset(record.paragraphFirstImage);
  pushAsset(record.paragraphSecondImage);
  pushAsset(record.advertisementImage);
  pushAsset(record.sideThumbImage);
  pushAsset(record.mainProfileImage);

  const walk = (node: unknown): void => {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node === 'object') {
      const obj = node as Record<string, unknown>;
      if (typeof obj.key === 'string' && obj.key.trim()) {
        keys.add(obj.key.trim());
      }
      if (typeof obj.publicId === 'string' && obj.publicId.trim()) {
        keys.add(obj.publicId.trim());
      }
      Object.values(obj).forEach(walk);
    }
  };
  walk(record.highlights);
  walk(record.paragraphSections);
  walk(record.advertisements);
  walk(record.imageGallery);
  walk(record.gridCards);
  walk(record.teamCards);
  walk(record.design9Cards);
  walk(record.design10HeroImage); walk(record.design10JourneyImage); walk(record.design10LeadershipCards); walk(record.design10GlobalCards); walk(record.design10GlobalImage); walk(record.design10DefineCards); walk(record.design10JourneyTimeline); walk(record.design10ExploreCards);
  return [...keys];
}

function slugifyTitle(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
  return slug || 'page';
}

function assertNotReservedSlug(slug: string): void {
  if (RESERVED_WEBPAGE_SLUGS.has(slug)) {
    throw new ValidationError(`Slug "${slug}" is reserved and cannot be used for a webpage`);
  }
}

function slugifyGalleryName(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120) || 'gallery'
  );
}

function sanitizeTeamCards(cards: unknown): unknown {
  if (!Array.isArray(cards)) return [];
  return cards.map((card) => {
    const c = (card && typeof card === 'object' ? card : {}) as Record<string, unknown>;
    const image =
      c.image && typeof c.image === 'object'
        ? (c.image as Record<string, unknown>)
        : {};
    return {
      image: {
        url: String(image.url || ''),
        key: String(image.key || image.publicId || ''),
      },
      name: String(c.name || '').trim(),
      designation: String(c.designation || '').trim(),
      qualification: String(c.qualification || '').trim(),
      specialization: String(c.specialization || '').trim(),
      phone: String(c.phone || '').trim(),
      facebook: String(c.facebook || '').trim(),
      instagram: String(c.instagram || '').trim(),
      youtube: String(c.youtube || '').trim(),
    };
  });
}

function sanitizeDesign9Cards(cards: unknown): unknown {
  if (!Array.isArray(cards)) return [];
  return cards.map((card) => {
    const c = (card && typeof card === 'object' ? card : {}) as Record<string, unknown>;
    return {
      heading: String(c.heading || '').trim(),
      description: String(c.description || ''),
      images: Array.isArray(c.images)
        ? c.images.map((img) => {
            const i = (img && typeof img === 'object' ? img : {}) as Record<string, unknown>;
            return { url: String(i.url || ''), key: String(i.key || i.publicId || '') };
          })
        : [],
    };
  });
}

function ensureGridCardGallerySlugs(cards: unknown): unknown {
  if (!Array.isArray(cards)) return [];
  return cards.map((card) => {
    const c = (card && typeof card === 'object' ? card : {}) as Record<string, unknown>;
    const title = String(c.title || '').trim();
    const gallerySlug =
      typeof c.gallerySlug === 'string' && c.gallerySlug.trim()
        ? c.gallerySlug.trim()
        : title
          ? slugifyGalleryName(title)
          : '';
    return { ...c, gallerySlug };
  });
}

export function toWebpageListDto(record: WebpageRecord, siteCode: SiteCode): WebpageListDto {
  return {
    id: record.id,
    siteCode,
    title: record.title,
    slug: record.slug,
    active: record.active,
    templateType: asTemplateType(record.templateType),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function toWebpageDto(record: WebpageRecord, siteCode: SiteCode): WebpageDto {
  return {
    ...toWebpageListDto(record, siteCode),
    titleLine: record.titleLine,
    keywords: record.keywords ?? [],
    firstTitle: record.firstTitle,
    secondTitle: record.secondTitle,
    imageFirst: asImageAsset(record.imageFirst) ?? emptyImage(),
    imageFirstMobile: asImageAsset(record.imageFirstMobile) ?? emptyImage(),
    bannerImage: asImageAsset(record.bannerImage) ?? emptyImage(),
    bannerImageMobile: asImageAsset(record.bannerImageMobile) ?? emptyImage(),
    paragraphFirstImage: asImageAsset(record.paragraphFirstImage) ?? emptyImage(),
    paragraphSecondImage: asImageAsset(record.paragraphSecondImage) ?? emptyImage(),
    advertisementImage: asImageAsset(record.advertisementImage) ?? emptyImage(),
    sideThumbImage: asImageAsset(record.sideThumbImage) ?? emptyImage(),
    mainProfileImage: asImageAsset(record.mainProfileImage) ?? emptyImage(),
    createTags: record.createTags ?? [],
    postedBy: record.postedBy ?? { admin: false, user: false },
    highlights: record.highlights ?? [],
    paragraphSections: record.paragraphSections ?? [],
    tableTitle: record.tableTitle,
    tableRows: record.tableRows ?? [],
    blockquoteMainTitle: record.blockquoteMainTitle,
    blockquoteLeftTitle: record.blockquoteLeftTitle,
    blockquoteDescription: record.blockquoteDescription,
    blockquoteTags: record.blockquoteTags ?? [],
    accordionTags: record.accordionTags ?? [],
    advertisements: record.advertisements ?? [],
    advertisementUrl: record.advertisementUrl,
    sideThumbName: record.sideThumbName,
    sideThumbDesignation: record.sideThumbDesignation,
    sideThumbDescription: record.sideThumbDescription,
    facebookUrl: record.facebookUrl,
    youtubeUrl: record.youtubeUrl,
    instaUrl: record.instaUrl,
    googleUrl: record.googleUrl,
    imageGallery: record.imageGallery ?? [],
    notices: record.notices ?? [],
    searchLocations: record.searchLocations ?? [],
    design5Chip: record.design5Chip,
    design5MainHeading: record.design5MainHeading,
    gridCards: record.gridCards ?? [],
    design6Chip: record.design6Chip,
    design6ExploreLink: record.design6ExploreLink,
    design6MainHeading: record.design6MainHeading,
    design6SubHeading: record.design6SubHeading,
    design6Author: record.design6Author,
    design6MidHeading: record.design6MidHeading,
    design6MidLink: record.design6MidLink,
    teamCards: record.teamCards ?? [],
    design7Chip: record.design7Chip,
    design7ExploreLink: record.design7ExploreLink,
    design7MainHeading: record.design7MainHeading,
    design9MiniHeading: record.design9MiniHeading,
    design9MainHeading: record.design9MainHeading,
    design9Description: record.design9Description,
    design9Cards: record.design9Cards ?? [],
    design10HeroMiniHeading: record.design10HeroMiniHeading, design10HeroMainHeading: record.design10HeroMainHeading, design10HeroDescription: record.design10HeroDescription, design10HeroImage: asImageAsset(record.design10HeroImage) ?? emptyImage(),
    design10StoryMiniHeading: record.design10StoryMiniHeading, design10StoryDescription: record.design10StoryDescription, design10StoryParagraph: record.design10StoryParagraph, design10StorySmallParagraph: record.design10StorySmallParagraph,
    design10DefineMiniHeading: record.design10DefineMiniHeading, design10DefineCards: record.design10DefineCards ?? [],
    design10JourneyMiniHeading: record.design10JourneyMiniHeading, design10JourneyMainHeading: record.design10JourneyMainHeading, design10JourneyImage: asImageAsset(record.design10JourneyImage) ?? emptyImage(), design10JourneyTimeline: record.design10JourneyTimeline ?? [],
    design10LeadershipMiniHeading: record.design10LeadershipMiniHeading, design10LeadershipMainHeading: record.design10LeadershipMainHeading, design10LeadershipCards: record.design10LeadershipCards ?? [],
    design10GlobalMiniHeading: record.design10GlobalMiniHeading, design10GlobalMainHeading: record.design10GlobalMainHeading, design10GlobalDescription: record.design10GlobalDescription, design10GlobalCards: record.design10GlobalCards ?? [], design10GlobalImage: asImageAsset(record.design10GlobalImage) ?? emptyImage(),
    design10ExploreMiniHeading: record.design10ExploreMiniHeading, design10ExploreMainHeading: record.design10ExploreMainHeading, design10ExploreCards: record.design10ExploreCards ?? [],
    design11HeroMiniHeading: record.design11HeroMiniHeading, design11HeroMainHeading: record.design11HeroMainHeading, design11HeroDescription: record.design11HeroDescription, design11HeroImage: asImageAsset(record.design11HeroImage) ?? emptyImage(),
    design11CapabilitiesMiniHeading: record.design11CapabilitiesMiniHeading, design11CapabilitiesMainHeading: record.design11CapabilitiesMainHeading, design11CapabilitiesDescription: record.design11CapabilitiesDescription, design11CapabilitiesCards: record.design11CapabilitiesCards ?? [],
    design11ProcessMiniHeading: record.design11ProcessMiniHeading, design11ProcessMainHeading: record.design11ProcessMainHeading, design11ProcessDescription: record.design11ProcessDescription, design11ProcessCards: record.design11ProcessCards ?? [],
    design11EngagementMiniHeading: record.design11EngagementMiniHeading, design11EngagementMainHeading: record.design11EngagementMainHeading, design11EngagementCards: record.design11EngagementCards ?? [],
    design11FaqMiniHeading: record.design11FaqMiniHeading, design11FaqMainHeading: record.design11FaqMainHeading, design11FaqDescription: record.design11FaqDescription, design11FaqItems: record.design11FaqItems ?? [],
    design11ExploreMiniHeading: record.design11ExploreMiniHeading, design11ExploreMainHeading: record.design11ExploreMainHeading, design11ExploreCards: record.design11ExploreCards ?? [],
    design12HeroMiniHeading: record.design12HeroMiniHeading, design12HeroMainHeading: record.design12HeroMainHeading, design12HeroDescription: record.design12HeroDescription, design12HeroImage: asImageAsset(record.design12HeroImage) ?? emptyImage(),
    design12ChallengeMiniHeading: record.design12ChallengeMiniHeading, design12ChallengeMainHeading: record.design12ChallengeMainHeading, design12ChallengeDescription: record.design12ChallengeDescription, design12ChallengeCard: record.design12ChallengeCard ?? {},
    design12HelpMiniHeading: record.design12HelpMiniHeading, design12HelpMainHeading: record.design12HelpMainHeading, design12HelpCards: record.design12HelpCards ?? [],
    design12MethodologyMiniHeading: record.design12MethodologyMiniHeading, design12MethodologyMainHeading: record.design12MethodologyMainHeading, design12MethodologyDescription: record.design12MethodologyDescription, design12MethodologyCards: record.design12MethodologyCards ?? [],
    design12OutcomesMiniHeading: record.design12OutcomesMiniHeading, design12OutcomesMainHeading: record.design12OutcomesMainHeading, design12OutcomeCards: record.design12OutcomeCards ?? [],
    design12RelatedMiniHeading: record.design12RelatedMiniHeading, design12RelatedMainHeading: record.design12RelatedMainHeading, design12RelatedCards: record.design12RelatedCards ?? [],
    design12ExploreMiniHeading: record.design12ExploreMiniHeading, design12ExploreMainHeading: record.design12ExploreMainHeading, design12ExploreCards: record.design12ExploreCards ?? [],
    design13HeroMiniHeading: record.design13HeroMiniHeading, design13HeroMainHeading: record.design13HeroMainHeading, design13HeroDescription: record.design13HeroDescription, design13HeroImage: asImageAsset(record.design13HeroImage) ?? emptyImage(),
    design13ProcessMiniHeading: record.design13ProcessMiniHeading, design13ProcessMainHeading: record.design13ProcessMainHeading, design13ProcessTimeline: record.design13ProcessTimeline ?? [],
    design13FaqMiniHeading: record.design13FaqMiniHeading, design13FaqMainHeading: record.design13FaqMainHeading, design13FaqItems: record.design13FaqItems ?? [],
    design13ExploreMiniHeading: record.design13ExploreMiniHeading, design13ExploreMainHeading: record.design13ExploreMainHeading, design13ExploreCards: record.design13ExploreCards ?? [],
    design14HeroMiniHeading: record.design14HeroMiniHeading, design14HeroMainHeading: record.design14HeroMainHeading, design14HeroDescription: record.design14HeroDescription, design14HeroImage: asImageAsset(record.design14HeroImage) ?? emptyImage(),
    design14SectorsMiniHeading: record.design14SectorsMiniHeading, design14SectorsMainHeading: record.design14SectorsMainHeading, design14SectorsDescription: record.design14SectorsDescription, design14SectorCards: record.design14SectorCards ?? [],
    design14PerspectiveMiniHeading: record.design14PerspectiveMiniHeading, design14PerspectiveMainHeading: record.design14PerspectiveMainHeading, design14PerspectiveDescription: record.design14PerspectiveDescription, design14PerspectiveCards: record.design14PerspectiveCards ?? [],
    design14QuestionsMiniHeading: record.design14QuestionsMiniHeading, design14QuestionsMainHeading: record.design14QuestionsMainHeading, design14QuestionsDescription: record.design14QuestionsDescription, design14QuestionCards: record.design14QuestionCards ?? [],
    design14Quote: record.design14Quote, design14QuoteDesignation: record.design14QuoteDesignation,
    design14ExploreMiniHeading: record.design14ExploreMiniHeading, design14ExploreMainHeading: record.design14ExploreMainHeading, design14ExploreCards: record.design14ExploreCards ?? [],
    design15HeroMiniHeading: record.design15HeroMiniHeading, design15HeroMainHeading: record.design15HeroMainHeading, design15HeroDescription: record.design15HeroDescription,
    design15NoticeMiniHeading: record.design15NoticeMiniHeading, design15NoticeMainHeading: record.design15NoticeMainHeading, design15NoticeDescription: record.design15NoticeDescription, design15FaqItems: record.design15FaqItems ?? [],
    design15ExploreCards: record.design15ExploreCards ?? [],
  };
}

export function toWebpagePublicDto(
  record: WebpageRecord,
  siteCode: SiteCode,
): WebpagePublicDto {
  return {
    ...toWebpageDto(record, siteCode),
    active: true,
  };
}

export class WebpageService {
  constructor(private readonly repository = webpageRepository) {}

  private async uniqueSlug(
    siteId: string,
    baseTitle: string,
    excludeId?: string,
  ): Promise<string> {
    const base = slugifyTitle(baseTitle);
    assertNotReservedSlug(base);
    let candidate = base;
    let attempt = 1;
    while (await this.repository.slugExists(siteId, candidate, excludeId)) {
      attempt += 1;
      candidate = `${base}-${attempt}`;
    }
    return candidate;
  }

  private async ensureSlugAvailable(
    siteId: string,
    slug: string,
    excludeId?: string,
  ): Promise<string> {
    assertNotReservedSlug(slug);
    const exists = await this.repository.slugExists(siteId, slug, excludeId);
    if (exists) {
      throw new ConflictError('A webpage with this slug already exists for this site');
    }
    return slug;
  }

  async listForSite(siteId: string, siteCode: SiteCode): Promise<WebpageListDto[]> {
    const rows = await this.repository.listBySiteId(siteId);
    return rows.map((row) => toWebpageListDto(row, siteCode));
  }

  async listPublicForSite(siteId: string, siteCode: SiteCode): Promise<WebpagePublicDto[]> {
    const rows = await this.repository.listBySiteId(siteId, { activeOnly: true });
    return rows.map((row) => toWebpagePublicDto(row, siteCode));
  }

  async getForSite(
    siteId: string,
    siteCode: SiteCode,
    webpageId: string,
  ): Promise<WebpageDto> {
    const record = await this.repository.findByIdForSite(siteId, webpageId);
    if (!record) throw new NotFoundError('Webpage not found');
    return toWebpageDto(record, siteCode);
  }

  async getPublicBySlug(
    siteId: string,
    siteCode: SiteCode,
    slug: string,
  ): Promise<WebpagePublicDto> {
    const record = await this.repository.findBySlugForSite(siteId, slug, true);
    if (!record) throw new NotFoundError('Webpage not found');
    return toWebpagePublicDto(record, siteCode);
  }

  async createForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    body: WebpageCreateBody;
  }): Promise<WebpageDto> {
    const requestedSlug = input.body.slug?.trim();
    const slug = requestedSlug
      ? await this.ensureSlugAvailable(input.siteId, requestedSlug)
      : await this.uniqueSlug(input.siteId, input.body.title);

    const record = await this.repository.create(input.siteId, {
      title: input.body.title,
      slug,
      active: input.body.active,
      templateType: input.body.templateType,
    });

    logger.info(
      {
        event: 'webpage.created',
        siteCode: input.siteCode,
        userId: input.userId,
        webpageId: record.id,
        slug: record.slug,
        templateType: record.templateType,
      },
      'Webpage created',
    );

    return toWebpageDto(record, input.siteCode);
  }

  async patchMetaForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    webpageId: string;
    body: WebpageMetaPatchBody;
  }): Promise<WebpageDto> {
    if (input.body.slug) {
      await this.ensureSlugAvailable(input.siteId, input.body.slug, input.webpageId);
    }

    const record = await this.repository.patchMeta(input.siteId, input.webpageId, {
      ...(input.body.title !== undefined ? { title: input.body.title } : {}),
      ...(input.body.slug !== undefined ? { slug: input.body.slug } : {}),
      ...(input.body.active !== undefined ? { active: input.body.active } : {}),
      ...(input.body.templateType !== undefined
        ? { templateType: input.body.templateType }
        : {}),
    });
    if (!record) throw new NotFoundError('Webpage not found');

    logger.info(
      {
        event: 'webpage.meta_patched',
        siteCode: input.siteCode,
        userId: input.userId,
        webpageId: record.id,
      },
      'Webpage meta updated',
    );

    return toWebpageDto(record, input.siteCode);
  }

  async updateContentForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    webpageId: string;
    body: WebpageContentPatchBody;
  }): Promise<WebpageDto> {
    const existing = await this.repository.findByIdForSite(input.siteId, input.webpageId);
    if (!existing) throw new NotFoundError('Webpage not found');

    if (input.body.slug) {
      await this.ensureSlugAvailable(input.siteId, input.body.slug, input.webpageId);
    }

    const data: Record<string, unknown> = {};
    const assign = <K extends keyof WebpageContentPatchBody>(key: K) => {
      if (input.body[key] !== undefined) {
        data[key as string] = input.body[key];
      }
    };

    assign('title');
    assign('slug');
    assign('active');
    assign('templateType');
    assign('titleLine');
    assign('keywords');
    assign('firstTitle');
    assign('secondTitle');
    assign('tableTitle');
    assign('blockquoteMainTitle');
    assign('blockquoteLeftTitle');
    assign('blockquoteDescription');
    assign('advertisementUrl');
    assign('sideThumbName');
    assign('sideThumbDesignation');
    assign('sideThumbDescription');
    assign('facebookUrl');
    assign('youtubeUrl');
    assign('instaUrl');
    assign('googleUrl');
    assign('design5Chip');
    assign('design5MainHeading');
    assign('design6Chip');
    assign('design6ExploreLink');
    assign('design6MainHeading');
    assign('design6SubHeading');
    assign('design6Author');
    assign('design6MidHeading');
    assign('design6MidLink');
    assign('design7Chip');
    assign('design7ExploreLink');
    assign('design7MainHeading');
    assign('design9MiniHeading');
    assign('design9MainHeading');
    assign('design9Description');
    assign('design10HeroMiniHeading'); assign('design10HeroMainHeading'); assign('design10HeroDescription'); assign('design10StoryMiniHeading'); assign('design10StoryDescription'); assign('design10StoryParagraph'); assign('design10StorySmallParagraph'); assign('design10DefineMiniHeading'); assign('design10JourneyMiniHeading'); assign('design10JourneyMainHeading'); assign('design10LeadershipMiniHeading'); assign('design10LeadershipMainHeading'); assign('design10GlobalMiniHeading'); assign('design10GlobalMainHeading'); assign('design10GlobalDescription'); assign('design10ExploreMiniHeading'); assign('design10ExploreMainHeading'); assign('design11HeroMiniHeading'); assign('design11HeroMainHeading'); assign('design11HeroDescription'); assign('design11CapabilitiesMiniHeading'); assign('design11CapabilitiesMainHeading'); assign('design11CapabilitiesDescription'); assign('design11ProcessMiniHeading'); assign('design11ProcessMainHeading'); assign('design11ProcessDescription'); assign('design11EngagementMiniHeading'); assign('design11EngagementMainHeading'); assign('design11FaqMiniHeading'); assign('design11FaqMainHeading'); assign('design11FaqDescription'); assign('design11ExploreMiniHeading'); assign('design11ExploreMainHeading'); assign('design12HeroMiniHeading'); assign('design12HeroMainHeading'); assign('design12HeroDescription'); assign('design12ChallengeMiniHeading'); assign('design12ChallengeMainHeading'); assign('design12ChallengeDescription'); assign('design12HelpMiniHeading'); assign('design12HelpMainHeading'); assign('design12MethodologyMiniHeading'); assign('design12MethodologyMainHeading'); assign('design12MethodologyDescription'); assign('design12OutcomesMiniHeading'); assign('design12OutcomesMainHeading'); assign('design12RelatedMiniHeading'); assign('design12RelatedMainHeading'); assign('design12ExploreMiniHeading'); assign('design12ExploreMainHeading'); assign('design13HeroMiniHeading'); assign('design13HeroMainHeading'); assign('design13HeroDescription'); assign('design13ProcessMiniHeading'); assign('design13ProcessMainHeading'); assign('design13FaqMiniHeading'); assign('design13FaqMainHeading'); assign('design13ExploreMiniHeading'); assign('design13ExploreMainHeading'); assign('design14HeroMiniHeading'); assign('design14HeroMainHeading'); assign('design14HeroDescription'); assign('design14SectorsMiniHeading'); assign('design14SectorsMainHeading'); assign('design14SectorsDescription'); assign('design14PerspectiveMiniHeading'); assign('design14PerspectiveMainHeading'); assign('design14PerspectiveDescription'); assign('design14QuestionsMiniHeading'); assign('design14QuestionsMainHeading'); assign('design14QuestionsDescription'); assign('design14Quote'); assign('design14QuoteDesignation'); assign('design14ExploreMiniHeading'); assign('design14ExploreMainHeading'); assign('design15HeroMiniHeading'); assign('design15HeroMainHeading'); assign('design15HeroDescription'); assign('design15NoticeMiniHeading'); assign('design15NoticeMainHeading'); assign('design15NoticeDescription');

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
      'design10HeroImage', 'design10JourneyImage', 'design10GlobalImage', 'design11HeroImage', 'design12HeroImage', 'design13HeroImage', 'design14HeroImage',
    ] as const) {
      const normalized = normalizeImageInput(input.body[key]);
      if (normalized !== undefined) data[key] = normalized;
    }

    if (input.body.createTags !== undefined) data.createTags = input.body.createTags;
    if (input.body.postedBy !== undefined) data.postedBy = input.body.postedBy;
    if (input.body.highlights !== undefined) data.highlights = input.body.highlights;
    if (input.body.paragraphSections !== undefined) {
      data.paragraphSections = input.body.paragraphSections;
    }
    if (input.body.tableRows !== undefined) data.tableRows = input.body.tableRows;
    if (input.body.blockquoteTags !== undefined) data.blockquoteTags = input.body.blockquoteTags;
    if (input.body.accordionTags !== undefined) data.accordionTags = input.body.accordionTags;
    if (input.body.advertisements !== undefined) data.advertisements = input.body.advertisements;
    if (input.body.imageGallery !== undefined) data.imageGallery = input.body.imageGallery;
    if (input.body.notices !== undefined) data.notices = input.body.notices;
    if (input.body.searchLocations !== undefined) {
      data.searchLocations = input.body.searchLocations;
    }
    if (input.body.gridCards !== undefined) {
      data.gridCards = ensureGridCardGallerySlugs(input.body.gridCards);
    }
    if (input.body.teamCards !== undefined) {
      data.teamCards = sanitizeTeamCards(input.body.teamCards);
    }
    if (input.body.design9Cards !== undefined) {
      data.design9Cards = sanitizeDesign9Cards(input.body.design9Cards);
    }
    for (const key of ['design10DefineCards','design10JourneyTimeline','design10LeadershipCards','design10GlobalCards','design10ExploreCards'] as const) {
      if (input.body[key] !== undefined) data[key] = input.body[key];
    }
    for (const key of ['design11CapabilitiesCards','design11ProcessCards','design11EngagementCards','design11FaqItems','design11ExploreCards'] as const) {
      if (input.body[key] !== undefined) data[key] = input.body[key];
    }
    if (input.body.design12ChallengeCard !== undefined) data.design12ChallengeCard = input.body.design12ChallengeCard;
    for (const key of ['design12HelpCards','design12MethodologyCards','design12OutcomeCards','design12RelatedCards','design12ExploreCards'] as const) {
      if (input.body[key] !== undefined) data[key] = input.body[key];
    }
    for (const key of ['design13ProcessTimeline','design13FaqItems','design13ExploreCards'] as const) {
      if (input.body[key] !== undefined) data[key] = input.body[key];
    }
    for (const key of ['design14SectorCards','design14PerspectiveCards','design14QuestionCards','design14ExploreCards'] as const) {
      if (input.body[key] !== undefined) data[key] = input.body[key];
    }
    for (const key of ['design15FaqItems','design15ExploreCards'] as const) {
      if (input.body[key] !== undefined) data[key] = input.body[key];
    }

    const record = await this.repository.updateContent(
      input.siteId,
      input.webpageId,
      data,
    );
    if (!record) throw new NotFoundError('Webpage not found');

    logger.info(
      {
        event: 'webpage.content_updated',
        siteCode: input.siteCode,
        userId: input.userId,
        webpageId: record.id,
        templateType: record.templateType,
      },
      'Webpage content updated',
    );

    return toWebpageDto(record, input.siteCode);
  }

  async deleteForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    webpageId: string;
  }): Promise<void> {
    const existing = await this.repository.findByIdForSite(input.siteId, input.webpageId);
    if (!existing) throw new NotFoundError('Webpage not found');

    const publicIds = collectPublicIds(existing);
    await Promise.all(publicIds.map((id) => deleteStoredCloudinaryAssetBestEffort(id)));

    const deleted = await this.repository.delete(input.siteId, input.webpageId);
    if (!deleted) throw new NotFoundError('Webpage not found');

    logger.info(
      {
        event: 'webpage.deleted',
        siteCode: input.siteCode,
        userId: input.userId,
        webpageId: input.webpageId,
      },
      'Webpage deleted',
    );
  }
}

export const webpageService = new WebpageService();

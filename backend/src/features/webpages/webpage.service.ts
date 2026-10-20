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

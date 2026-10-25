import { deleteStoredCloudinaryAssetBestEffort } from '@/lib/cloudinary';
import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { heroBannerRepository } from './hero-banner.repository';
import type { HeroBannerConfigBody } from './hero-banner.validation';
import type {
  HeroBannerConfigDto,
  HeroBannerSlideDto,
  HeroBannerSlideRecord,
  HeroBannerSlideWrite,
  SiteCodeDto,
} from './hero-banner.types';

function preferHttpsUrl(url: string): string {
  if (url.startsWith('http://res.cloudinary.com/')) {
    return `https://${url.slice('http://'.length)}`;
  }
  return url;
}

export function emptyHeroBannerConfigDto(siteCode: SiteCodeDto): HeroBannerConfigDto {
  return {
    siteCode,
    slides: [],
  };
}

function toSlideDto(record: HeroBannerSlideRecord): HeroBannerSlideDto {
  return {
    id: record.id,
    layoutType: record.layoutType,
    order: record.order,
    active: record.active,
    mobileImageUrl: preferHttpsUrl(record.mobileImageUrl),
    mobileImagePublicId: record.mobileImagePublicId,
    desktopImageUrl: preferHttpsUrl(record.desktopImageUrl),
    desktopImagePublicId: record.desktopImagePublicId,
    miniHeading: record.miniHeading,
    mainHeading: record.mainHeading,
    description: record.description,
    buttonLabel: record.buttonLabel,
    buttonUrl: record.buttonUrl,
    button2Label: record.button2Label,
    button2Url: record.button2Url,
    leftImageUrl: preferHttpsUrl(record.leftImageUrl),
    leftImagePublicId: record.leftImagePublicId,
    leftImageClickUrl: record.leftImageClickUrl || '',
    rightImageUrl: preferHttpsUrl(record.rightImageUrl),
    rightImagePublicId: record.rightImagePublicId,
    rightImageClickUrl: record.rightImageClickUrl || '',
    gridImages: record.gridImages.map((image) => ({
      id: image.id,
      imageUrl: preferHttpsUrl(image.imageUrl),
      imagePublicId: image.imagePublicId,
      alt: image.alt,
      order: image.order,
    })),
  };
}

export function toHeroBannerConfigDto(
  records: HeroBannerSlideRecord[],
  siteCode: SiteCodeDto,
  options?: { activeOnly?: boolean },
): HeroBannerConfigDto {
  const activeOnly = options?.activeOnly ?? false;
  const slides = records.filter((slide) => !activeOnly || slide.active).map(toSlideDto);

  return { siteCode, slides };
}

function bodyToWrites(body: HeroBannerConfigBody): HeroBannerSlideWrite[] {
  return body.slides.map((slide, index) => {
    const isFullWidth = slide.layoutType === 'FULL_WIDTH';
    const isSplit = slide.layoutType === 'SPLIT_DUAL';
    const isMulti = slide.layoutType === 'MULTI_IMAGE';

    return {
      layoutType: slide.layoutType,
      order: slide.order ?? index,
      active: slide.active,
      mobileImageUrl: isFullWidth ? preferHttpsUrl(slide.mobileImageUrl || '') : '',
      mobileImagePublicId: isFullWidth ? slide.mobileImagePublicId || '' : '',
      desktopImageUrl: isFullWidth ? preferHttpsUrl(slide.desktopImageUrl || '') : '',
      desktopImagePublicId: isFullWidth ? slide.desktopImagePublicId || '' : '',
      miniHeading: isFullWidth ? '' : slide.miniHeading || '',
      mainHeading: isFullWidth ? '' : slide.mainHeading || '',
      description: isFullWidth ? '' : slide.description || '',
      buttonLabel: isFullWidth ? '' : slide.buttonLabel || '',
      // FULL_WIDTH uses buttonUrl as the image click destination.
      buttonUrl: slide.buttonUrl || '',
      button2Label: isSplit ? slide.button2Label || '' : '',
      button2Url: isSplit ? slide.button2Url || '' : '',
      leftImageUrl: isSplit ? preferHttpsUrl(slide.leftImageUrl || '') : '',
      leftImagePublicId: isSplit ? slide.leftImagePublicId || '' : '',
      leftImageClickUrl: isSplit ? slide.leftImageClickUrl || '' : '',
      rightImageUrl: isSplit ? preferHttpsUrl(slide.rightImageUrl || '') : '',
      rightImagePublicId: isSplit ? slide.rightImagePublicId || '' : '',
      rightImageClickUrl: isSplit ? slide.rightImageClickUrl || '' : '',
      gridImages: isMulti
        ? (slide.gridImages || []).map((image, imageIndex) => ({
            imageUrl: preferHttpsUrl(image.imageUrl),
            imagePublicId: image.imagePublicId || '',
            alt: image.alt || '',
            order: image.order ?? imageIndex,
          }))
        : [],
    };
  });
}

function collectSlidePublicIds(slides: (HeroBannerSlideRecord | HeroBannerSlideWrite)[]): string[] {
  const ids: string[] = [];
  for (const slide of slides) {
    for (const publicId of [
      slide.mobileImagePublicId,
      slide.desktopImagePublicId,
      slide.leftImagePublicId,
      slide.rightImagePublicId,
      ...slide.gridImages.map((image) => image.imagePublicId),
    ]) {
      const trimmed = publicId.trim();
      if (trimmed) ids.push(trimmed);
    }
  }
  return ids;
}

/** Public IDs present before save but not retained after save. */
export function collectOrphanedHeroPublicIds(
  previous: HeroBannerSlideRecord[],
  next: HeroBannerSlideWrite[],
): string[] {
  const retained = new Set(collectSlidePublicIds(next));
  const orphans = new Set<string>();
  for (const publicId of collectSlidePublicIds(previous)) {
    if (!retained.has(publicId)) {
      orphans.add(publicId);
    }
  }
  return [...orphans];
}

export class HeroBannerService {
  constructor(private readonly repository = heroBannerRepository) {}

  async getForSite(
    siteId: string,
    siteCode: SiteCode,
    options?: { activeOnly?: boolean },
  ): Promise<HeroBannerConfigDto> {
    const records = await this.repository.listBySiteId(siteId);
    if (records.length === 0) {
      return emptyHeroBannerConfigDto(siteCode);
    }
    return toHeroBannerConfigDto(records, siteCode, options);
  }

  async upsertForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    body: HeroBannerConfigBody;
  }): Promise<HeroBannerConfigDto> {
    const existing = await this.repository.listBySiteId(input.siteId);
    const writes = bodyToWrites(input.body);
    const records = await this.repository.replaceBySiteId(input.siteId, writes);

    const orphanedPublicIds = collectOrphanedHeroPublicIds(existing, writes);
    await Promise.all(
      orphanedPublicIds.map((publicId) => deleteStoredCloudinaryAssetBestEffort(publicId)),
    );

    logger.info(
      {
        event: 'hero_banner_config.upserted',
        siteCode: input.siteCode,
        userId: input.userId,
        slideCount: records.length,
        orphanedImageCount: orphanedPublicIds.length,
        layoutCounts: {
          FULL_WIDTH: records.filter((s) => s.layoutType === 'FULL_WIDTH').length,
          SPLIT_DUAL: records.filter((s) => s.layoutType === 'SPLIT_DUAL').length,
          MULTI_IMAGE: records.filter((s) => s.layoutType === 'MULTI_IMAGE').length,
        },
      },
      'Hero banner config upserted',
    );

    return toHeroBannerConfigDto(records, input.siteCode);
  }
}

export const heroBannerService = new HeroBannerService();

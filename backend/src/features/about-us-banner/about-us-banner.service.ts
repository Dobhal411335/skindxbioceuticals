import { deleteStoredCloudinaryAssetBestEffort } from '@/lib/cloudinary';
import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { aboutUsBannerRepository } from './about-us-banner.repository';
import type { AboutUsBannerConfigBody } from './about-us-banner.validation';
import type {
  AboutUsAboutCardDto,
  AboutUsBannerConfigDto,
  AboutUsBannerConfigRecord,
  AboutUsBannerConfigUpsertData,
  AboutUsServiceDto,
  SiteCodeDto,
} from './about-us-banner.types';

function preferHttpsUrl(url: string): string {
  if (url.startsWith('http://res.cloudinary.com/')) {
    return `https://${url.slice('http://'.length)}`;
  }
  return url;
}

export function emptyAboutUsBannerConfigDto(siteCode: SiteCodeDto): AboutUsBannerConfigDto {
  return {
    id: null,
    siteCode,
    promoLabel: '',
    promoHeading: '',
    promoDescription: '',
    promoSubheading: '',
    promoButtonLabel: '',
    promoButtonUrl: '',
    servicesHeading: '',
    servicesViewAllLabel: '',
    servicesViewAllUrl: '',
    aboutCards: [],
    highlightItems: [],
    textSlides: [],
    services: [],
    updatedAt: null,
  };
}

function toAboutCardDto(
  card: AboutUsBannerConfigRecord['aboutCards'][number],
): AboutUsAboutCardDto {
  return {
    id: card.id,
    imageUrl: preferHttpsUrl(card.imageUrl),
    imagePublicId: card.imagePublicId,
    label: card.label,
    heading: card.heading,
    description: card.description,
    buttonLabel: card.buttonLabel,
    buttonUrl: card.buttonUrl,
    sortOrder: card.sortOrder,
    active: card.active,
  };
}

function toServiceDto(
  service: NonNullable<AboutUsBannerConfigRecord['services']>[number],
): AboutUsServiceDto {
  return {
    id: service.id,
    imageUrl: preferHttpsUrl(service.imageUrl),
    imagePublicId: service.imagePublicId,
    buttonLabel: service.buttonLabel,
    heading: service.heading,
    description: service.description,
    highlights: service.highlights.map((highlight) => ({
      id: highlight.id,
      text: highlight.text,
      sortOrder: highlight.sortOrder,
    })),
    doctorImageUrl: preferHttpsUrl(service.doctorImageUrl),
    doctorImagePublicId: service.doctorImagePublicId,
    doctorName: service.doctorName,
    doctorDesignation: service.doctorDesignation,
    doctorButtonLabel: service.doctorButtonLabel,
    doctorButtonUrl: service.doctorButtonUrl,
    sortOrder: service.sortOrder,
    active: service.active,
  };
}

export function toAboutUsBannerConfigDto(
  record: AboutUsBannerConfigRecord,
  siteCode: SiteCodeDto,
  options?: { activeOnly?: boolean },
): AboutUsBannerConfigDto {
  const activeOnly = options?.activeOnly ?? false;

  return {
    id: record.id,
    siteCode,
    promoLabel: record.promoLabel,
    promoHeading: record.promoHeading,
    promoDescription: record.promoDescription,
    promoSubheading: record.promoSubheading,
    promoButtonLabel: record.promoButtonLabel,
    promoButtonUrl: record.promoButtonUrl,
    servicesHeading: record.servicesHeading,
    servicesViewAllLabel: record.servicesViewAllLabel,
    servicesViewAllUrl: record.servicesViewAllUrl,
    aboutCards: record.aboutCards.filter((card) => !activeOnly || card.active).map(toAboutCardDto),
    highlightItems: record.highlightItems
      .filter((item) => !activeOnly || item.active)
      .map((item) => ({
        id: item.id,
        imageUrl: preferHttpsUrl(item.imageUrl),
        imagePublicId: item.imagePublicId,
        heading: item.heading,
        buttonLabel: item.buttonLabel,
        buttonUrl: item.buttonUrl,
        sortOrder: item.sortOrder,
        active: item.active,
      })),
    textSlides: record.textSlides
      .filter((slide) => !activeOnly || slide.active)
      .map((slide) => ({
        id: slide.id,
        heading: slide.heading,
        subheading: slide.subheading,
        sortOrder: slide.sortOrder,
        active: slide.active,
      })),
    services: (record.services || [])
      .filter((service) => !activeOnly || service.active)
      .map(toServiceDto),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function bodyToUpsertData(body: AboutUsBannerConfigBody): AboutUsBannerConfigUpsertData {
  return {
    promoLabel: body.promoLabel,
    promoHeading: body.promoHeading,
    promoDescription: body.promoDescription,
    promoSubheading: body.promoSubheading,
    promoButtonLabel: body.promoButtonLabel,
    promoButtonUrl: body.promoButtonUrl || '',
    servicesHeading: body.servicesHeading || '',
    servicesViewAllLabel: body.servicesViewAllLabel || '',
    servicesViewAllUrl: body.servicesViewAllUrl || '',
    aboutCards: body.aboutCards.map((card, index) => ({
      imageUrl: preferHttpsUrl(card.imageUrl || ''),
      imagePublicId: card.imagePublicId || '',
      label: card.label || '',
      heading: card.heading,
      description: card.description,
      buttonLabel: card.buttonLabel,
      buttonUrl: card.buttonUrl || '',
      sortOrder: card.sortOrder ?? index,
      active: card.active,
    })),
    highlightItems: body.highlightItems.map((item, index) => ({
      imageUrl: preferHttpsUrl(item.imageUrl || ''),
      imagePublicId: item.imagePublicId || '',
      heading: item.heading,
      buttonLabel: item.buttonLabel,
      buttonUrl: item.buttonUrl || '',
      sortOrder: item.sortOrder ?? index,
      active: item.active,
    })),
    textSlides: body.textSlides.map((slide, index) => ({
      heading: slide.heading,
      subheading: slide.subheading,
      sortOrder: slide.sortOrder ?? index,
      active: slide.active,
    })),
    services: (body.services || []).map((service, index) => ({
      imageUrl: preferHttpsUrl(service.imageUrl || ''),
      imagePublicId: service.imagePublicId || '',
      buttonLabel: service.buttonLabel,
      heading: service.heading,
      description: service.description,
      highlights: service.highlights.map((highlight, highlightIndex) => ({
        text: highlight.text,
        sortOrder: highlight.sortOrder ?? highlightIndex,
      })),
      doctorImageUrl: preferHttpsUrl(service.doctorImageUrl || ''),
      doctorImagePublicId: service.doctorImagePublicId || '',
      doctorName: service.doctorName || '',
      doctorDesignation: service.doctorDesignation || '',
      doctorButtonLabel: service.doctorButtonLabel || '',
      doctorButtonUrl: service.doctorButtonUrl || '',
      sortOrder: service.sortOrder ?? index,
      active: service.active,
    })),
  };
}

function collectAboutUsPublicIds(
  source:
    | Pick<AboutUsBannerConfigRecord, 'aboutCards' | 'highlightItems' | 'services'>
    | Pick<AboutUsBannerConfigUpsertData, 'aboutCards' | 'highlightItems' | 'services'>,
): string[] {
  const ids: string[] = [];
  for (const card of source.aboutCards) {
    const trimmed = card.imagePublicId.trim();
    if (trimmed) ids.push(trimmed);
  }
  for (const item of source.highlightItems) {
    const trimmed = item.imagePublicId.trim();
    if (trimmed) ids.push(trimmed);
  }
  for (const service of source.services || []) {
    for (const publicId of [service.imagePublicId, service.doctorImagePublicId]) {
      const trimmed = publicId.trim();
      if (trimmed) ids.push(trimmed);
    }
  }
  return ids;
}

/** Public IDs present before save but not retained after save. */
export function collectOrphanedAboutUsPublicIds(
  previous: AboutUsBannerConfigRecord | null,
  next: AboutUsBannerConfigUpsertData,
): string[] {
  if (!previous) return [];

  const retained = new Set(collectAboutUsPublicIds(next));
  const orphans = new Set<string>();
  for (const publicId of collectAboutUsPublicIds(previous)) {
    if (!retained.has(publicId)) {
      orphans.add(publicId);
    }
  }
  return [...orphans];
}

export class AboutUsBannerService {
  constructor(private readonly repository = aboutUsBannerRepository) {}

  async getForSite(
    siteId: string,
    siteCode: SiteCode,
    options?: { activeOnly?: boolean },
  ): Promise<AboutUsBannerConfigDto> {
    const record = await this.repository.findBySiteId(siteId);
    if (!record) {
      return emptyAboutUsBannerConfigDto(siteCode);
    }
    return toAboutUsBannerConfigDto(record, siteCode, options);
  }

  async upsertForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    body: AboutUsBannerConfigBody;
  }): Promise<AboutUsBannerConfigDto> {
    const existing = await this.repository.findBySiteId(input.siteId);
    const data = bodyToUpsertData(input.body);
    const record = await this.repository.upsertBySiteId(input.siteId, data);

    const orphanedPublicIds = collectOrphanedAboutUsPublicIds(existing, data);
    await Promise.all(
      orphanedPublicIds.map((publicId) => deleteStoredCloudinaryAssetBestEffort(publicId)),
    );

    logger.info(
      {
        event: 'about_us_banner_config.upserted',
        siteCode: input.siteCode,
        userId: input.userId,
        aboutUsBannerConfigId: record.id,
        aboutCardCount: record.aboutCards.length,
        highlightItemCount: record.highlightItems.length,
        textSlideCount: record.textSlides.length,
        serviceCount: (record.services || []).length,
        orphanedImageCount: orphanedPublicIds.length,
      },
      'About Us banner config upserted',
    );

    return toAboutUsBannerConfigDto(record, input.siteCode);
  }
}

export const aboutUsBannerService = new AboutUsBannerService();

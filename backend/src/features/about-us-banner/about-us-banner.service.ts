import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { aboutUsBannerRepository } from './about-us-banner.repository';
import type { AboutUsBannerConfigBody } from './about-us-banner.validation';
import type {
  AboutUsAboutCardDto,
  AboutUsBannerConfigDto,
  AboutUsBannerConfigRecord,
  AboutUsBannerConfigUpsertData,
  AboutUsHighlightItemDto,
  AboutUsTextSlideDto,
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
    promoSubheading: '',
    promoButtonLabel: '',
    promoButtonUrl: '',
    aboutCards: [],
    highlightItems: [],
    textSlides: [],
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

function toHighlightDto(
  item: AboutUsBannerConfigRecord['highlightItems'][number],
): AboutUsHighlightItemDto {
  return {
    id: item.id,
    imageUrl: preferHttpsUrl(item.imageUrl),
    imagePublicId: item.imagePublicId,
    heading: item.heading,
    buttonLabel: item.buttonLabel,
    buttonUrl: item.buttonUrl,
    sortOrder: item.sortOrder,
    active: item.active,
  };
}

function toTextSlideDto(
  slide: AboutUsBannerConfigRecord['textSlides'][number],
): AboutUsTextSlideDto {
  return {
    id: slide.id,
    heading: slide.heading,
    subheading: slide.subheading,
    sortOrder: slide.sortOrder,
    active: slide.active,
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
    promoSubheading: record.promoSubheading,
    promoButtonLabel: record.promoButtonLabel,
    promoButtonUrl: record.promoButtonUrl,
    aboutCards: record.aboutCards
      .filter((card) => !activeOnly || card.active)
      .map(toAboutCardDto),
    highlightItems: record.highlightItems
      .filter((item) => !activeOnly || item.active)
      .map(toHighlightDto),
    textSlides: record.textSlides
      .filter((slide) => !activeOnly || slide.active)
      .map(toTextSlideDto),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function bodyToUpsertData(body: AboutUsBannerConfigBody): AboutUsBannerConfigUpsertData {
  return {
    promoLabel: body.promoLabel,
    promoHeading: body.promoHeading,
    promoSubheading: body.promoSubheading,
    promoButtonLabel: body.promoButtonLabel,
    promoButtonUrl: body.promoButtonUrl || '',
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
  };
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
    const data = bodyToUpsertData(input.body);
    const record = await this.repository.upsertBySiteId(input.siteId, data);

    logger.info(
      {
        event: 'about_us_banner_config.upserted',
        siteCode: input.siteCode,
        userId: input.userId,
        aboutUsBannerConfigId: record.id,
        aboutCardCount: record.aboutCards.length,
        highlightItemCount: record.highlightItems.length,
        textSlideCount: record.textSlides.length,
      },
      'About Us banner config upserted',
    );

    return toAboutUsBannerConfigDto(record, input.siteCode);
  }
}

export const aboutUsBannerService = new AboutUsBannerService();

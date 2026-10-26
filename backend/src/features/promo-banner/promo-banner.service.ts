import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { promoBannerRepository } from './promo-banner.repository';
import type { PromoBannerConfigBody } from './promo-banner.validation';
import type {
  PromoBannerConfigDto,
  PromoBannerConfigRecord,
  PromoBannerConfigUpsertData,
  PromoBannerItemDto,
  SiteCodeDto,
} from './promo-banner.types';

export function emptyPromoBannerConfigDto(siteCode: SiteCodeDto): PromoBannerConfigDto {
  return {
    id: null,
    siteCode,
    items: [],
    updatedAt: null,
  };
}

function toItemDto(item: PromoBannerConfigRecord['items'][number]): PromoBannerItemDto {
  return {
    id: item.id,
    miniHeading: item.miniHeading,
    heading: item.heading,
    description: item.description,
    buttonLabel: item.buttonLabel,
    buttonUrl: item.buttonUrl,
    sortOrder: item.sortOrder,
    active: item.active,
  };
}

export function toPromoBannerConfigDto(
  record: PromoBannerConfigRecord,
  siteCode: SiteCodeDto,
  options?: { activeOnly?: boolean },
): PromoBannerConfigDto {
  const activeOnly = options?.activeOnly ?? false;

  return {
    id: record.id,
    siteCode,
    items: record.items
      .filter((item) => !activeOnly || item.active)
      .map(toItemDto),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function bodyToUpsertData(body: PromoBannerConfigBody): PromoBannerConfigUpsertData {
  return {
    items: body.items.map((item, index) => ({
      miniHeading: item.miniHeading || '',
      heading: item.heading || '',
      description: item.description || '',
      buttonLabel: item.buttonLabel || '',
      buttonUrl: item.buttonUrl || '',
      sortOrder: item.sortOrder ?? index,
      active: item.active,
    })),
  };
}

export class PromoBannerService {
  constructor(private readonly repository = promoBannerRepository) {}

  async getForSite(
    siteId: string,
    siteCode: SiteCode,
    options?: { activeOnly?: boolean },
  ): Promise<PromoBannerConfigDto> {
    const record = await this.repository.findBySiteId(siteId);
    if (!record) {
      return emptyPromoBannerConfigDto(siteCode);
    }
    return toPromoBannerConfigDto(record, siteCode, options);
  }

  async upsertForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    body: PromoBannerConfigBody;
  }): Promise<PromoBannerConfigDto> {
    const data = bodyToUpsertData(input.body);
    const record = await this.repository.upsertBySiteId(input.siteId, data);

    logger.info(
      {
        event: 'promo_banner_config.upserted',
        siteCode: input.siteCode,
        userId: input.userId,
        promoBannerConfigId: record.id,
        itemCount: record.items.length,
      },
      'Promo banner config upserted',
    );

    return toPromoBannerConfigDto(record, input.siteCode);
  }
}

export const promoBannerService = new PromoBannerService();

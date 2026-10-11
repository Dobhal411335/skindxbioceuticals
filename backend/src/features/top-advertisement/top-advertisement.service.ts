import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { topAdvertisementRepository } from './top-advertisement.repository';
import type { TopAdvertisementConfigBody } from './top-advertisement.validation';
import type {
  TopAdvertisementConfigDto,
  TopAdvertisementConfigRecord,
  TopAdvertisementConfigUpsertData,
  TopAdvertisementItemDto,
  TopAdvertisementSectionDto,
  SiteCodeDto,
} from './top-advertisement.types';

export function emptyTopAdvertisementConfigDto(siteCode: SiteCodeDto): TopAdvertisementConfigDto {
  return {
    id: null,
    siteCode,
    announcements: [],
    utilityItems: [],
    benefits: [],
    updatedAt: null,
  };
}

function toItemDto(item: {
  id: string;
  section: TopAdvertisementSectionDto;
  text: string;
  url: string;
  active: boolean;
}): TopAdvertisementItemDto {
  return {
    id: item.id,
    section: item.section,
    text: item.text,
    url: item.url,
    active: item.active,
  };
}

function itemsForSection(
  record: TopAdvertisementConfigRecord,
  section: TopAdvertisementSectionDto,
  activeOnly: boolean,
): TopAdvertisementItemDto[] {
  return record.items
    .filter((item) => item.section === section && (!activeOnly || item.active))
    .map(toItemDto);
}

export function toTopAdvertisementConfigDto(
  record: TopAdvertisementConfigRecord,
  siteCode: SiteCodeDto,
  options?: { activeOnly?: boolean },
): TopAdvertisementConfigDto {
  const activeOnly = options?.activeOnly ?? false;

  return {
    id: record.id,
    siteCode,
    announcements: itemsForSection(record, 'ANNOUNCEMENT', activeOnly),
    utilityItems: itemsForSection(record, 'UTILITY', activeOnly),
    benefits: itemsForSection(record, 'BENEFIT', activeOnly),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function bodyToUpsertData(body: TopAdvertisementConfigBody): TopAdvertisementConfigUpsertData {
  const items: TopAdvertisementConfigUpsertData['items'] = [];

  body.announcements.forEach((item) => {
    items.push({
      section: 'ANNOUNCEMENT',
      text: item.text,
      url: item.url || '',
      active: item.active,
    });
  });

  body.utilityItems.forEach((item) => {
    items.push({
      section: 'UTILITY',
      text: item.text,
      url: item.url || '',
      active: item.active,
    });
  });

  body.benefits.forEach((item) => {
    items.push({
      section: 'BENEFIT',
      text: item.text,
      url: item.url || '',
      active: item.active,
    });
  });

  return { items };
}

export class TopAdvertisementService {
  constructor(private readonly repository = topAdvertisementRepository) {}

  async getForSite(
    siteId: string,
    siteCode: SiteCode,
    options?: { activeOnly?: boolean },
  ): Promise<TopAdvertisementConfigDto> {
    const record = await this.repository.findBySiteId(siteId);
    if (!record) {
      return emptyTopAdvertisementConfigDto(siteCode);
    }
    return toTopAdvertisementConfigDto(record, siteCode, options);
  }

  async upsertForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    body: TopAdvertisementConfigBody;
  }): Promise<TopAdvertisementConfigDto> {
    const data = bodyToUpsertData(input.body);
    const record = await this.repository.upsertBySiteId(input.siteId, data);

    logger.info(
      {
        event: 'top_advertisement_config.upserted',
        siteCode: input.siteCode,
        userId: input.userId,
        topAdvertisementConfigId: record.id,
        itemCount: record.items.length,
      },
      'Top advertisement config upserted',
    );

    return toTopAdvertisementConfigDto(record, input.siteCode);
  }
}

export const topAdvertisementService = new TopAdvertisementService();

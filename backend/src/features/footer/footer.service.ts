import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { footerRepository } from './footer.repository';
import type { FooterConfigBody } from './footer.validation';
import type {
  FooterConfigDto,
  FooterConfigRecord,
  FooterConfigUpsertData,
  SiteCodeDto,
} from './footer.types';

export function emptyFooterConfigDto(siteCode: SiteCodeDto): FooterConfigDto {
  return {
    id: null,
    siteCode,
    thankYou: '',
    description: '',
    columns: [],
    updatedAt: null,
  };
}

export function toFooterConfigDto(
  record: FooterConfigRecord,
  siteCode: SiteCodeDto,
  options?: { activeOnly?: boolean },
): FooterConfigDto {
  const activeOnly = options?.activeOnly ?? false;

  const columns = record.columns
    .filter((column) => !activeOnly || column.active)
    .map((column) => ({
      id: column.id,
      title: column.title,
      active: column.active,
      order: column.order,
      links: column.links
        .filter((link) => !activeOnly || link.active)
        .map((link) => ({
          id: link.id,
          label: link.label,
          url: link.url,
          active: link.active,
          order: link.order,
        })),
    }));

  return {
    id: record.id,
    siteCode,
    thankYou: record.thankYou,
    description: record.description,
    columns,
    updatedAt: record.updatedAt.toISOString(),
  };
}

function bodyToUpsertData(body: FooterConfigBody): FooterConfigUpsertData {
  return {
    thankYou: body.thankYou,
    description: body.description,
    columns: body.columns.map((column, index) => ({
      title: column.title,
      active: column.active,
      order: column.order || index + 1,
      links: column.links.map((link, linkIndex) => ({
        label: link.label,
        url: link.url || '#',
        active: link.active,
        order: link.order || linkIndex + 1,
      })),
    })),
  };
}

export class FooterService {
  constructor(private readonly repository = footerRepository) {}

  async getForSite(
    siteId: string,
    siteCode: SiteCode,
    options?: { activeOnly?: boolean },
  ): Promise<FooterConfigDto> {
    const record = await this.repository.findBySiteId(siteId);
    if (!record) {
      return emptyFooterConfigDto(siteCode);
    }
    return toFooterConfigDto(record, siteCode, options);
  }

  async upsertForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    body: FooterConfigBody;
  }): Promise<FooterConfigDto> {
    const data = bodyToUpsertData(input.body);
    const record = await this.repository.upsertBySiteId(input.siteId, data);

    logger.info(
      {
        event: 'footer_config.upserted',
        siteCode: input.siteCode,
        userId: input.userId,
        footerConfigId: record.id,
        columnCount: record.columns.length,
      },
      'Footer config upserted',
    );

    return toFooterConfigDto(record, input.siteCode);
  }
}

export const footerService = new FooterService();

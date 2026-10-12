import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { faqRepository } from './faq.repository';
import type { FaqConfigBody } from './faq.validation';
import type {
  FaqConfigDto,
  FaqSectionRecord,
  FaqSectionWrite,
  SiteCodeDto,
} from './faq.types';

export function emptyFaqConfigDto(siteCode: SiteCodeDto): FaqConfigDto {
  return {
    siteCode,
    sections: [],
  };
}

export function toFaqConfigDto(
  records: FaqSectionRecord[],
  siteCode: SiteCodeDto,
  options?: { activeOnly?: boolean; landingOnly?: boolean },
): FaqConfigDto {
  const activeOnly = options?.activeOnly ?? false;
  const landingOnly = options?.landingOnly ?? false;

  const sections = records
    .filter((section) => !activeOnly || section.active)
    .map((section) => {
      const items = section.items
        .filter((item) => {
          if (activeOnly && !item.active) return false;
          if (landingOnly && !item.showOnLanding) return false;
          return true;
        })
        .map((item) => ({
          id: item.id,
          question: item.question,
          answer: item.answer,
          showOnLanding: item.showOnLanding,
          active: item.active,
          order: item.order,
        }));

      return {
        id: section.id,
        title: section.title,
        active: section.active,
        order: section.order,
        items,
      };
    })
    .filter((section) => !landingOnly || section.items.length > 0);

  return { siteCode, sections };
}

function bodyToWrites(body: FaqConfigBody): FaqSectionWrite[] {
  return body.sections.map((section, index) => ({
    title: section.title,
    active: section.active,
    order: section.order || index + 1,
    items: section.items.map((item, itemIndex) => ({
      question: item.question,
      answer: item.answer,
      showOnLanding: item.showOnLanding,
      active: item.active,
      order: item.order || itemIndex + 1,
    })),
  }));
}

export class FaqService {
  constructor(private readonly repository = faqRepository) {}

  async getForSite(
    siteId: string,
    siteCode: SiteCode,
    options?: { activeOnly?: boolean; landingOnly?: boolean },
  ): Promise<FaqConfigDto> {
    const records = await this.repository.listBySiteId(siteId);
    if (records.length === 0) {
      return emptyFaqConfigDto(siteCode);
    }
    return toFaqConfigDto(records, siteCode, options);
  }

  async upsertForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    body: FaqConfigBody;
  }): Promise<FaqConfigDto> {
    const writes = bodyToWrites(input.body);
    const records = await this.repository.replaceBySiteId(input.siteId, writes);

    logger.info(
      {
        event: 'faq_config.upserted',
        siteCode: input.siteCode,
        userId: input.userId,
        sectionCount: records.length,
        itemCount: records.reduce((sum, section) => sum + section.items.length, 0),
      },
      'FAQ config upserted',
    );

    return toFaqConfigDto(records, input.siteCode);
  }
}

export const faqService = new FaqService();

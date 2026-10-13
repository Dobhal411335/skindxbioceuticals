import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { insightsRepository } from './insights.repository';
import type { InsightsConfigBody } from './insights.validation';
import type {
  InsightCardRecord,
  InsightCardWrite,
  InsightQaRecord,
  InsightQaWrite,
  InsightsConfigDto,
  SiteCodeDto,
} from './insights.types';

export function emptyInsightsConfigDto(siteCode: SiteCodeDto): InsightsConfigDto {
  return {
    siteCode,
    cards: [],
    qaItems: [],
  };
}

export function toInsightsConfigDto(
  cards: InsightCardRecord[],
  qaItems: InsightQaRecord[],
  siteCode: SiteCodeDto,
  options?: { activeOnly?: boolean },
): InsightsConfigDto {
  const activeOnly = options?.activeOnly ?? false;

  return {
    siteCode,
    cards: cards
      .filter((card) => !activeOnly || card.active)
      .map((card) => ({
        id: card.id,
        category: card.category,
        name: card.name,
        publishedAt: card.publishedAt.toISOString(),
        imageUrl: card.imageUrl,
        imagePublicId: card.imagePublicId,
        description: card.description,
        order: card.order,
        active: card.active,
      })),
    qaItems: qaItems
      .filter((item) => !activeOnly || item.active)
      .map((item) => ({
        id: item.id,
        question: item.question,
        answer: item.answer,
        order: item.order,
        active: item.active,
      })),
  };
}

function bodyToWrites(body: InsightsConfigBody): {
  cards: InsightCardWrite[];
  qaItems: InsightQaWrite[];
} {
  return {
    cards: body.cards.map((card, index) => ({
      category: card.category,
      name: card.name,
      publishedAt: card.publishedAt,
      imageUrl: card.imageUrl,
      imagePublicId: card.imagePublicId,
      description: card.description,
      active: card.active,
      order: card.order || index + 1,
    })),
    qaItems: body.qaItems.map((item, index) => ({
      question: item.question,
      answer: item.answer,
      active: item.active,
      order: item.order || index + 1,
    })),
  };
}

export class InsightsService {
  constructor(private readonly repository = insightsRepository) {}

  async getForSite(
    siteId: string,
    siteCode: SiteCode,
    options?: { activeOnly?: boolean },
  ): Promise<InsightsConfigDto> {
    const [cards, qaItems] = await Promise.all([
      this.repository.listCardsBySiteId(siteId),
      this.repository.listQaBySiteId(siteId),
    ]);

    if (cards.length === 0 && qaItems.length === 0) {
      return emptyInsightsConfigDto(siteCode);
    }

    return toInsightsConfigDto(cards, qaItems, siteCode, options);
  }

  async upsertForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    body: InsightsConfigBody;
  }): Promise<InsightsConfigDto> {
    const writes = bodyToWrites(input.body);
    const { cards, qaItems } = await this.repository.replaceBySiteId(
      input.siteId,
      writes.cards,
      writes.qaItems,
    );

    logger.info(
      {
        event: 'insights_config.upserted',
        siteCode: input.siteCode,
        userId: input.userId,
        cardCount: cards.length,
        qaCount: qaItems.length,
      },
      'Insights config upserted',
    );

    return toInsightsConfigDto(cards, qaItems, input.siteCode);
  }
}

export const insightsService = new InsightsService();

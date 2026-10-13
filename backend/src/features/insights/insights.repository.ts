import { prisma } from '@/lib/prisma';
import type {
  InsightCardRecord,
  InsightCardWrite,
  InsightQaRecord,
  InsightQaWrite,
} from './insights.types';

function toCardRecord(row: {
  id: string;
  siteId: string;
  category: string;
  name: string;
  publishedAt: Date;
  imageUrl: string;
  imagePublicId: string;
  description: string;
  order: number;
  active: boolean;
}): InsightCardRecord {
  return {
    id: row.id,
    siteId: row.siteId,
    category: row.category,
    name: row.name,
    publishedAt: row.publishedAt,
    imageUrl: row.imageUrl,
    imagePublicId: row.imagePublicId,
    description: row.description,
    order: row.order,
    active: row.active,
  };
}

function toQaRecord(row: {
  id: string;
  siteId: string;
  question: string;
  answer: string;
  order: number;
  active: boolean;
}): InsightQaRecord {
  return {
    id: row.id,
    siteId: row.siteId,
    question: row.question,
    answer: row.answer,
    order: row.order,
    active: row.active,
  };
}

export class InsightsRepository {
  async listCardsBySiteId(siteId: string): Promise<InsightCardRecord[]> {
    const rows = await prisma.insightCard.findMany({
      where: { siteId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map(toCardRecord);
  }

  async listQaBySiteId(siteId: string): Promise<InsightQaRecord[]> {
    const rows = await prisma.insightQa.findMany({
      where: { siteId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map(toQaRecord);
  }

  async replaceBySiteId(
    siteId: string,
    cards: InsightCardWrite[],
    qaItems: InsightQaWrite[],
  ): Promise<{ cards: InsightCardRecord[]; qaItems: InsightQaRecord[] }> {
    return prisma.$transaction(async (tx) => {
      await tx.insightCard.deleteMany({ where: { siteId } });
      await tx.insightQa.deleteMany({ where: { siteId } });

      if (cards.length > 0) {
        await tx.insightCard.createMany({
          data: cards.map((card) => ({
            siteId,
            category: card.category,
            name: card.name,
            publishedAt: card.publishedAt,
            imageUrl: card.imageUrl,
            imagePublicId: card.imagePublicId,
            description: card.description,
            order: card.order,
            active: card.active,
          })),
        });
      }

      if (qaItems.length > 0) {
        await tx.insightQa.createMany({
          data: qaItems.map((item) => ({
            siteId,
            question: item.question,
            answer: item.answer,
            order: item.order,
            active: item.active,
          })),
        });
      }

      const [cardRows, qaRows] = await Promise.all([
        tx.insightCard.findMany({
          where: { siteId },
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        }),
        tx.insightQa.findMany({
          where: { siteId },
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        }),
      ]);

      return {
        cards: cardRows.map(toCardRecord),
        qaItems: qaRows.map(toQaRecord),
      };
    });
  }
}

export const insightsRepository = new InsightsRepository();

import { prisma } from '@/lib/prisma';
import type {
  ClinicalConfidenceConfigRecord,
  ClinicalConfidenceConfigBody,
} from './clinical-confidence.types';

const includeCards = { cards: { orderBy: { sortOrder: 'asc' as const } } };

function mapRecord(row: any): ClinicalConfidenceConfigRecord {
  return {
    id: row.id,
    siteId: row.siteId,
    badgeText: row.badgeText,
    heading: row.heading,
    description: row.description,
    button1Label: row.button1Label,
    button1Url: row.button1Url,
    button2Label: row.button2Label,
    button2Url: row.button2Url,
    backgroundImageUrl: row.backgroundImageUrl,
    backgroundImagePublicId: row.backgroundImagePublicId,
    updatedAt: row.updatedAt,
    cards: row.cards.map((card: any) => ({ ...card })),
  };
}

export class ClinicalConfidenceRepository {
  async findBySiteId(siteId: string): Promise<ClinicalConfidenceConfigRecord | null> {
    const row = await prisma.clinicalConfidenceConfig.findUnique({
      where: { siteId },
      include: includeCards,
    });
    return row ? mapRecord(row) : null;
  }

  async upsertBySiteId(
    siteId: string,
    data: ClinicalConfidenceConfigBody,
  ): Promise<ClinicalConfidenceConfigRecord> {
    return prisma.$transaction(async (tx) => {
      const config = await tx.clinicalConfidenceConfig.upsert({
        where: { siteId },
        update: {
          badgeText: data.badgeText,
          heading: data.heading,
          description: data.description,
          button1Label: data.button1Label,
          button1Url: data.button1Url,
          button2Label: data.button2Label,
          button2Url: data.button2Url,
          backgroundImageUrl: data.backgroundImageUrl,
          backgroundImagePublicId: data.backgroundImagePublicId,
        },
        create: { siteId, ...data, cards: undefined },
      });
      await tx.clinicalConfidenceCard.deleteMany({ where: { configId: config.id } });
      if (data.cards.length) {
        await tx.clinicalConfidenceCard.createMany({
          data: data.cards.map((card, index) => ({
            configId: config.id,
            ...card,
            sortOrder: card.sortOrder ?? index,
          })),
        });
      }
      const row = await tx.clinicalConfidenceConfig.findUniqueOrThrow({
        where: { id: config.id },
        include: includeCards,
      });
      return mapRecord(row);
    });
  }
}

export const clinicalConfidenceRepository = new ClinicalConfidenceRepository();

import { prisma } from '@/lib/prisma';
import type {
  TopAdvertisementConfigRecord,
  TopAdvertisementConfigUpsertData,
  TopAdvertisementSectionDto,
} from './top-advertisement.types';

const includeItems = {
  items: {
    orderBy: [{ section: 'asc' as const }, { createdAt: 'asc' as const }],
  },
};

function toRecord(row: {
  id: string;
  siteId: string;
  updatedAt: Date;
  items: Array<{
    id: string;
    configId: string;
    section: TopAdvertisementSectionDto;
    text: string;
    url: string;
    active: boolean;
  }>;
}): TopAdvertisementConfigRecord {
  return {
    id: row.id,
    siteId: row.siteId,
    updatedAt: row.updatedAt,
    items: row.items.map((item) => ({
      id: item.id,
      configId: item.configId,
      section: item.section,
      text: item.text,
      url: item.url,
      active: item.active,
    })),
  };
}

export class TopAdvertisementRepository {
  async findBySiteId(siteId: string): Promise<TopAdvertisementConfigRecord | null> {
    const row = await prisma.topAdvertisementConfig.findUnique({
      where: { siteId },
      include: includeItems,
    });
    return row ? toRecord(row) : null;
  }

  async upsertBySiteId(
    siteId: string,
    data: TopAdvertisementConfigUpsertData,
  ): Promise<TopAdvertisementConfigRecord> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.topAdvertisementConfig.findUnique({
        where: { siteId },
        select: { id: true },
      });

      const config = existing
        ? await tx.topAdvertisementConfig.update({
            where: { siteId },
            data: {},
          })
        : await tx.topAdvertisementConfig.create({
            data: { siteId },
          });

      await tx.topAdvertisementItem.deleteMany({
        where: { configId: config.id },
      });

      if (data.items.length > 0) {
        await tx.topAdvertisementItem.createMany({
          data: data.items.map((item) => ({
            configId: config.id,
            section: item.section,
            text: item.text,
            url: item.url,
            active: item.active,
          })),
        });
      }

      const row = await tx.topAdvertisementConfig.findUniqueOrThrow({
        where: { id: config.id },
        include: includeItems,
      });

      return toRecord(row);
    });
  }
}

export const topAdvertisementRepository = new TopAdvertisementRepository();

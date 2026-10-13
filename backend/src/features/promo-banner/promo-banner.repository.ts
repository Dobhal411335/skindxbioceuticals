import { prisma } from '@/lib/prisma';
import type {
  PromoBannerConfigRecord,
  PromoBannerConfigUpsertData,
} from './promo-banner.types';

function mapRecord(row: {
  id: string;
  siteId: string;
  updatedAt: Date;
  items: Array<{
    id: string;
    imageUrl: string;
    imagePublicId: string;
    miniHeading: string;
    heading: string;
    buttonLabel: string;
    buttonUrl: string;
    sortOrder: number;
    active: boolean;
  }>;
}): PromoBannerConfigRecord {
  return {
    id: row.id,
    siteId: row.siteId,
    updatedAt: row.updatedAt,
    items: row.items.map((item) => ({
      id: item.id,
      imageUrl: item.imageUrl,
      imagePublicId: item.imagePublicId,
      miniHeading: item.miniHeading,
      heading: item.heading,
      buttonLabel: item.buttonLabel,
      buttonUrl: item.buttonUrl,
      sortOrder: item.sortOrder,
      active: item.active,
    })),
  };
}

const includeNested = {
  items: { orderBy: { sortOrder: 'asc' as const } },
};

export class PromoBannerRepository {
  async findBySiteId(siteId: string): Promise<PromoBannerConfigRecord | null> {
    const row = await prisma.promoBannerConfig.findUnique({
      where: { siteId },
      include: includeNested,
    });
    return row ? mapRecord(row) : null;
  }

  async upsertBySiteId(
    siteId: string,
    data: PromoBannerConfigUpsertData,
  ): Promise<PromoBannerConfigRecord> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.promoBannerConfig.findUnique({
        where: { siteId },
        select: { id: true },
      });

      const config = existing
        ? await tx.promoBannerConfig.update({
            where: { siteId },
            data: {},
          })
        : await tx.promoBannerConfig.create({
            data: { siteId },
          });

      await tx.promoBannerItem.deleteMany({ where: { configId: config.id } });

      if (data.items.length > 0) {
        await tx.promoBannerItem.createMany({
          data: data.items.map((item) => ({
            configId: config.id,
            ...item,
          })),
        });
      }

      const row = await tx.promoBannerConfig.findUniqueOrThrow({
        where: { id: config.id },
        include: includeNested,
      });

      return mapRecord(row);
    });
  }
}

export const promoBannerRepository = new PromoBannerRepository();

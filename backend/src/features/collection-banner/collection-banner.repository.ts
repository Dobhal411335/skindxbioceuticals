import { prisma } from '@/lib/prisma';
import type {
  CollectionBannerConfigRecord,
  CollectionBannerConfigUpsertData,
} from './collection-banner.types';

function mapRecord(row: {
  id: string;
  siteId: string;
  sectionLabel: string;
  sectionHeading: string;
  updatedAt: Date;
  items: Array<{
    id: string;
    imageUrl: string;
    imagePublicId: string;
    title: string;
    description: string;
    buttonUrl: string;
    sortOrder: number;
    active: boolean;
  }>;
}): CollectionBannerConfigRecord {
  return {
    id: row.id,
    siteId: row.siteId,
    sectionLabel: row.sectionLabel,
    sectionHeading: row.sectionHeading,
    updatedAt: row.updatedAt,
    items: row.items.map((item) => ({
      id: item.id,
      imageUrl: item.imageUrl,
      imagePublicId: item.imagePublicId,
      title: item.title,
      description: item.description,
      buttonUrl: item.buttonUrl,
      sortOrder: item.sortOrder,
      active: item.active,
    })),
  };
}

const includeNested = {
  items: { orderBy: { sortOrder: 'asc' as const } },
};

export class CollectionBannerRepository {
  async findBySiteId(siteId: string): Promise<CollectionBannerConfigRecord | null> {
    const row = await prisma.collectionBannerConfig.findUnique({
      where: { siteId },
      include: includeNested,
    });
    return row ? mapRecord(row) : null;
  }

  async upsertBySiteId(
    siteId: string,
    data: CollectionBannerConfigUpsertData,
  ): Promise<CollectionBannerConfigRecord> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.collectionBannerConfig.findUnique({
        where: { siteId },
        select: { id: true },
      });

      const config = existing
        ? await tx.collectionBannerConfig.update({
            where: { siteId },
            data: {
              sectionLabel: data.sectionLabel,
              sectionHeading: data.sectionHeading,
            },
          })
        : await tx.collectionBannerConfig.create({
            data: {
              siteId,
              sectionLabel: data.sectionLabel,
              sectionHeading: data.sectionHeading,
            },
          });

      await tx.collectionBannerItem.deleteMany({ where: { configId: config.id } });

      if (data.items.length > 0) {
        await tx.collectionBannerItem.createMany({
          data: data.items.map((item) => ({
            configId: config.id,
            ...item,
          })),
        });
      }

      const row = await tx.collectionBannerConfig.findUniqueOrThrow({
        where: { id: config.id },
        include: includeNested,
      });

      return mapRecord(row);
    });
  }
}

export const collectionBannerRepository = new CollectionBannerRepository();

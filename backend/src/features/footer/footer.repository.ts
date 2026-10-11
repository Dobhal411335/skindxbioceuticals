import { prisma } from '@/lib/prisma';
import type {
  FooterConfigRecord,
  FooterConfigUpsertData,
} from './footer.types';

const includeNested = {
  columns: {
    orderBy: [{ order: 'asc' as const }, { createdAt: 'asc' as const }],
    include: {
      links: {
        orderBy: [{ order: 'asc' as const }, { createdAt: 'asc' as const }],
      },
    },
  },
};

function toRecord(row: {
  id: string;
  siteId: string;
  thankYou: string;
  description: string;
  updatedAt: Date;
  columns: Array<{
    id: string;
    footerConfigId: string;
    title: string;
    order: number;
    active: boolean;
    links: Array<{
      id: string;
      columnId: string;
      label: string;
      url: string;
      order: number;
      active: boolean;
    }>;
  }>;
}): FooterConfigRecord {
  return {
    id: row.id,
    siteId: row.siteId,
    thankYou: row.thankYou,
    description: row.description,
    updatedAt: row.updatedAt,
    columns: row.columns.map((column) => ({
      id: column.id,
      footerConfigId: column.footerConfigId,
      title: column.title,
      order: column.order,
      active: column.active,
      links: column.links.map((link) => ({
        id: link.id,
        columnId: link.columnId,
        label: link.label,
        url: link.url,
        order: link.order,
        active: link.active,
      })),
    })),
  };
}

export class FooterRepository {
  async findBySiteId(siteId: string): Promise<FooterConfigRecord | null> {
    const row = await prisma.footerConfig.findUnique({
      where: { siteId },
      include: includeNested,
    });
    return row ? toRecord(row) : null;
  }

  async upsertBySiteId(
    siteId: string,
    data: FooterConfigUpsertData,
  ): Promise<FooterConfigRecord> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.footerConfig.findUnique({
        where: { siteId },
        select: { id: true },
      });

      const config = existing
        ? await tx.footerConfig.update({
            where: { siteId },
            data: {
              thankYou: data.thankYou,
              description: data.description,
            },
          })
        : await tx.footerConfig.create({
            data: {
              siteId,
              thankYou: data.thankYou,
              description: data.description,
            },
          });

      await tx.footerColumn.deleteMany({
        where: { footerConfigId: config.id },
      });

      for (const column of data.columns) {
        await tx.footerColumn.create({
          data: {
            footerConfigId: config.id,
            title: column.title,
            order: column.order,
            active: column.active,
            links: {
              create: column.links.map((link) => ({
                label: link.label,
                url: link.url,
                order: link.order,
                active: link.active,
              })),
            },
          },
        });
      }

      const row = await tx.footerConfig.findUniqueOrThrow({
        where: { id: config.id },
        include: includeNested,
      });

      return toRecord(row);
    });
  }
}

export const footerRepository = new FooterRepository();

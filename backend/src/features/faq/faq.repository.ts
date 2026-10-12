import { prisma } from '@/lib/prisma';
import type { FaqSectionRecord, FaqSectionWrite } from './faq.types';

const includeItems = {
  items: {
    orderBy: [{ order: 'asc' as const }, { createdAt: 'asc' as const }],
  },
};

function toRecord(row: {
  id: string;
  siteId: string;
  title: string;
  order: number;
  active: boolean;
  items: Array<{
    id: string;
    sectionId: string;
    question: string;
    answer: string;
    showOnLanding: boolean;
    order: number;
    active: boolean;
  }>;
}): FaqSectionRecord {
  return {
    id: row.id,
    siteId: row.siteId,
    title: row.title,
    order: row.order,
    active: row.active,
    items: row.items.map((item) => ({
      id: item.id,
      sectionId: item.sectionId,
      question: item.question,
      answer: item.answer,
      showOnLanding: item.showOnLanding,
      order: item.order,
      active: item.active,
    })),
  };
}

export class FaqRepository {
  async listBySiteId(siteId: string): Promise<FaqSectionRecord[]> {
    const rows = await prisma.faqSection.findMany({
      where: { siteId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: includeItems,
    });
    return rows.map(toRecord);
  }

  async replaceBySiteId(
    siteId: string,
    sections: FaqSectionWrite[],
  ): Promise<FaqSectionRecord[]> {
    return prisma.$transaction(async (tx) => {
      await tx.faqSection.deleteMany({ where: { siteId } });

      for (const section of sections) {
        await tx.faqSection.create({
          data: {
            siteId,
            title: section.title,
            order: section.order,
            active: section.active,
            items: {
              create: section.items.map((item) => ({
                question: item.question,
                answer: item.answer,
                showOnLanding: item.showOnLanding,
                order: item.order,
                active: item.active,
              })),
            },
          },
        });
      }

      const rows = await tx.faqSection.findMany({
        where: { siteId },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        include: includeItems,
      });

      return rows.map(toRecord);
    });
  }
}

export const faqRepository = new FaqRepository();

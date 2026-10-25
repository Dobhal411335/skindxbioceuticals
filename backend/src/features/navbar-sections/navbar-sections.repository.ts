import { prisma } from '@/lib/prisma';
import type {
  NavbarSectionRecord,
  NavbarSectionWrite,
  NavbarSubSectionRecord,
} from './navbar-sections.types';

function mapSubSection(row: {
  id: string;
  sectionId: string;
  title: string;
  url: string;
  description: string;
  active: boolean;
  order: number;
}): NavbarSubSectionRecord {
  return {
    id: row.id,
    sectionId: row.sectionId,
    title: row.title,
    url: row.url,
    description: row.description,
    active: row.active,
    order: row.order,
  };
}

function mapSection(row: {
  id: string;
  siteId: string;
  title: string;
  url: string;
  menuHeading: string;
  menuDescription: string;
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  subSections: Array<{
    id: string;
    sectionId: string;
    title: string;
    url: string;
    active: boolean;
    order: number;
  }>;
}): NavbarSectionRecord {
  return {
    id: row.id,
    siteId: row.siteId,
    title: row.title,
    url: row.url,
    menuHeading: row.menuHeading,
    menuDescription: row.menuDescription,
    active: row.active,
    order: row.order,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    subSections: row.subSections
      .map(mapSubSection)
      .sort((a, b) => a.order - b.order),
  };
}

const includeSubSections = {
  subSections: {
    orderBy: [{ order: 'asc' as const }, { createdAt: 'asc' as const }],
  },
};

export class NavbarSectionsRepository {
  async listBySiteId(siteId: string): Promise<NavbarSectionRecord[]> {
    const rows = await prisma.navbarSection.findMany({
      where: { siteId },
      include: includeSubSections,
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map(mapSection);
  }

  async listActiveBySiteId(siteId: string): Promise<NavbarSectionRecord[]> {
    const rows = await prisma.navbarSection.findMany({
      where: { siteId, active: true },
      include: {
        subSections: {
          where: { active: true },
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map(mapSection);
  }

  async findByIdForSite(
    siteId: string,
    sectionId: string,
  ): Promise<NavbarSectionRecord | null> {
    const row = await prisma.navbarSection.findFirst({
      where: { id: sectionId, siteId },
      include: includeSubSections,
    });
    return row ? mapSection(row) : null;
  }

  async nextOrder(siteId: string): Promise<number> {
    const last = await prisma.navbarSection.findFirst({
      where: { siteId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    return (last?.order ?? 0) + 1;
  }

  async create(siteId: string, data: NavbarSectionWrite): Promise<NavbarSectionRecord> {
    const row = await prisma.navbarSection.create({
      data: {
        siteId,
        title: data.title,
        url: data.url,
        menuHeading: data.menuHeading,
        menuDescription: data.menuDescription,
        active: data.active,
        order: data.order,
        subSections: {
          create: data.subSections.map((sub) => ({
            title: sub.title,
            url: sub.url,
            description: sub.description,
            active: sub.active,
            order: sub.order,
          })),
        },
      },
      include: includeSubSections,
    });
    return mapSection(row);
  }

  async update(
    siteId: string,
    sectionId: string,
    data: NavbarSectionWrite,
  ): Promise<NavbarSectionRecord | null> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.navbarSection.findFirst({
        where: { id: sectionId, siteId },
        select: { id: true },
      });
      if (!existing) {
        return null;
      }

      await tx.navbarSubSection.deleteMany({ where: { sectionId } });

      const row = await tx.navbarSection.update({
        where: { id: sectionId },
        data: {
          title: data.title,
          url: data.url,
          menuHeading: data.menuHeading,
          menuDescription: data.menuDescription,
          active: data.active,
          order: data.order,
          subSections: {
            create: data.subSections.map((sub) => ({
              title: sub.title,
              url: sub.url,
              description: sub.description,
              active: sub.active,
              order: sub.order,
            })),
          },
        },
        include: includeSubSections,
      });

      return mapSection(row);
    });
  }

  async setActive(
    siteId: string,
    sectionId: string,
    active: boolean,
  ): Promise<NavbarSectionRecord | null> {
    const existing = await prisma.navbarSection.findFirst({
      where: { id: sectionId, siteId },
      select: { id: true },
    });
    if (!existing) {
      return null;
    }

    const row = await prisma.navbarSection.update({
      where: { id: sectionId },
      data: { active },
      include: includeSubSections,
    });
    return mapSection(row);
  }

  async delete(siteId: string, sectionId: string): Promise<boolean> {
    const existing = await prisma.navbarSection.findFirst({
      where: { id: sectionId, siteId },
      select: { id: true },
    });
    if (!existing) {
      return false;
    }
    await prisma.navbarSection.delete({ where: { id: sectionId } });
    return true;
  }
}

export const navbarSectionsRepository = new NavbarSectionsRepository();

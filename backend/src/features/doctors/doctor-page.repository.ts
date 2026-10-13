import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type {
  DoctorPageConfigRecord,
  DoctorPageConfigUpsertData,
} from './doctor-page.types';

function parseHighlights(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
}

function mapRecord(row: {
  id: string;
  siteId: string;
  aboutHeading: string;
  aboutDescription: string;
  aboutHighlights: Prisma.JsonValue;
  aboutButtonLabel: string;
  aboutButtonUrl: string;
  aboutImageUrl: string;
  aboutImagePublicId: string;
  aboutSecondaryImageUrl: string;
  aboutSecondaryImagePublicId: string;
  experienceYears: number | null;
  servicesHeading: string;
  servicesSubheading: string;
  updatedAt: Date;
  services: Array<{
    id: string;
    iconKey: string;
    name: string;
    description: string;
    readMoreUrl: string;
    order: number;
    active: boolean;
  }>;
}): DoctorPageConfigRecord {
  return {
    id: row.id,
    siteId: row.siteId,
    aboutHeading: row.aboutHeading,
    aboutDescription: row.aboutDescription,
    aboutHighlights: parseHighlights(row.aboutHighlights),
    aboutButtonLabel: row.aboutButtonLabel,
    aboutButtonUrl: row.aboutButtonUrl,
    aboutImageUrl: row.aboutImageUrl,
    aboutImagePublicId: row.aboutImagePublicId,
    aboutSecondaryImageUrl: row.aboutSecondaryImageUrl,
    aboutSecondaryImagePublicId: row.aboutSecondaryImagePublicId,
    experienceYears: row.experienceYears,
    servicesHeading: row.servicesHeading,
    servicesSubheading: row.servicesSubheading,
    updatedAt: row.updatedAt,
    services: row.services.map((service) => ({
      id: service.id,
      iconKey: service.iconKey,
      name: service.name,
      description: service.description,
      readMoreUrl: service.readMoreUrl,
      order: service.order,
      active: service.active,
    })),
  };
}

const includeNested = {
  services: { orderBy: { order: 'asc' as const } },
};

export class DoctorPageRepository {
  async findBySiteId(siteId: string): Promise<DoctorPageConfigRecord | null> {
    const row = await prisma.doctorPageConfig.findUnique({
      where: { siteId },
      include: includeNested,
    });
    return row ? mapRecord(row) : null;
  }

  async upsertBySiteId(
    siteId: string,
    data: DoctorPageConfigUpsertData,
  ): Promise<DoctorPageConfigRecord> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.doctorPageConfig.findUnique({
        where: { siteId },
        select: { id: true },
      });

      const config = existing
        ? await tx.doctorPageConfig.update({
            where: { siteId },
            data: {
              aboutHeading: data.aboutHeading,
              aboutDescription: data.aboutDescription,
              aboutHighlights: data.aboutHighlights,
              aboutButtonLabel: data.aboutButtonLabel,
              aboutButtonUrl: data.aboutButtonUrl,
              aboutImageUrl: data.aboutImageUrl,
              aboutImagePublicId: data.aboutImagePublicId,
              aboutSecondaryImageUrl: data.aboutSecondaryImageUrl,
              aboutSecondaryImagePublicId: data.aboutSecondaryImagePublicId,
              experienceYears: data.experienceYears,
              servicesHeading: data.servicesHeading,
              servicesSubheading: data.servicesSubheading,
            },
          })
        : await tx.doctorPageConfig.create({
            data: {
              siteId,
              aboutHeading: data.aboutHeading,
              aboutDescription: data.aboutDescription,
              aboutHighlights: data.aboutHighlights,
              aboutButtonLabel: data.aboutButtonLabel,
              aboutButtonUrl: data.aboutButtonUrl,
              aboutImageUrl: data.aboutImageUrl,
              aboutImagePublicId: data.aboutImagePublicId,
              aboutSecondaryImageUrl: data.aboutSecondaryImageUrl,
              aboutSecondaryImagePublicId: data.aboutSecondaryImagePublicId,
              experienceYears: data.experienceYears,
              servicesHeading: data.servicesHeading,
              servicesSubheading: data.servicesSubheading,
            },
          });

      await tx.doctorServiceItem.deleteMany({ where: { configId: config.id } });

      if (data.services.length > 0) {
        await tx.doctorServiceItem.createMany({
          data: data.services.map((service) => ({
            configId: config.id,
            ...service,
          })),
        });
      }

      const row = await tx.doctorPageConfig.findUniqueOrThrow({
        where: { id: config.id },
        include: includeNested,
      });

      return mapRecord(row);
    });
  }
}

export const doctorPageRepository = new DoctorPageRepository();

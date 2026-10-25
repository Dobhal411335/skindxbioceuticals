import { prisma } from '@/lib/prisma';
import type {
  AboutUsBannerConfigRecord,
  AboutUsBannerConfigUpsertData,
} from './about-us-banner.types';

function mapRecord(row: {
  id: string;
  siteId: string;
  promoLabel: string;
  promoHeading: string;
  promoSubheading: string;
  promoButtonLabel: string;
  promoButtonUrl: string;
  servicesHeading?: string;
  servicesViewAllLabel?: string;
  servicesViewAllUrl?: string;
  updatedAt: Date;
  aboutCards: Array<{
    id: string;
    imageUrl: string;
    imagePublicId: string;
    label: string;
    heading: string;
    description: string;
    buttonLabel: string;
    buttonUrl: string;
    sortOrder: number;
    active: boolean;
  }>;
  highlightItems: Array<{
    id: string;
    imageUrl: string;
    imagePublicId: string;
    heading: string;
    buttonLabel: string;
    buttonUrl: string;
    sortOrder: number;
    active: boolean;
  }>;
  textSlides: Array<{
    id: string;
    heading: string;
    subheading: string;
    sortOrder: number;
    active: boolean;
  }>;
  services?: Array<{
    id: string;
    configId: string;
    imageUrl: string;
    imagePublicId: string;
    buttonLabel: string;
    heading: string;
    description: string;
    doctorImageUrl: string;
    doctorImagePublicId: string;
    doctorName: string;
    doctorDesignation: string;
    doctorButtonLabel: string;
    doctorButtonUrl: string;
    sortOrder: number;
    active: boolean;
    highlights: Array<{ id: string; serviceId: string; text: string; sortOrder: number }>;
  }>;
}): AboutUsBannerConfigRecord {
  return {
    id: row.id,
    siteId: row.siteId,
    promoLabel: row.promoLabel,
    promoHeading: row.promoHeading,
    promoSubheading: row.promoSubheading,
    promoButtonLabel: row.promoButtonLabel,
    promoButtonUrl: row.promoButtonUrl,
    servicesHeading: row.servicesHeading,
    servicesViewAllLabel: row.servicesViewAllLabel,
    servicesViewAllUrl: row.servicesViewAllUrl,
    updatedAt: row.updatedAt,
    aboutCards: row.aboutCards.map((card) => ({
      id: card.id,
      imageUrl: card.imageUrl,
      imagePublicId: card.imagePublicId,
      label: card.label,
      heading: card.heading,
      description: card.description,
      buttonLabel: card.buttonLabel,
      buttonUrl: card.buttonUrl,
      sortOrder: card.sortOrder,
      active: card.active,
    })),
    highlightItems: row.highlightItems.map((item) => ({
      id: item.id,
      imageUrl: item.imageUrl,
      imagePublicId: item.imagePublicId,
      heading: item.heading,
      buttonLabel: item.buttonLabel,
      buttonUrl: item.buttonUrl,
      sortOrder: item.sortOrder,
      active: item.active,
    })),
    textSlides: row.textSlides.map((slide) => ({
      id: slide.id,
      heading: slide.heading,
      subheading: slide.subheading,
      sortOrder: slide.sortOrder,
      active: slide.active,
    })),
    services: (row.services || []).map((service) => ({
      id: service.id,
      configId: service.configId,
      imageUrl: service.imageUrl,
      imagePublicId: service.imagePublicId,
      buttonLabel: service.buttonLabel,
      heading: service.heading,
      description: service.description,
      doctorImageUrl: service.doctorImageUrl,
      doctorImagePublicId: service.doctorImagePublicId,
      doctorName: service.doctorName,
      doctorDesignation: service.doctorDesignation,
      doctorButtonLabel: service.doctorButtonLabel,
      doctorButtonUrl: service.doctorButtonUrl,
      sortOrder: service.sortOrder,
      active: service.active,
      highlights: service.highlights.map((highlight) => ({
        id: highlight.id,
        serviceId: highlight.serviceId,
        text: highlight.text,
        sortOrder: highlight.sortOrder,
      })),
    })),
  };
}

const includeNested = {
  aboutCards: { orderBy: { sortOrder: 'asc' as const } },
  highlightItems: { orderBy: { sortOrder: 'asc' as const } },
  textSlides: { orderBy: { sortOrder: 'asc' as const } },
  services: {
    orderBy: { sortOrder: 'asc' as const },
    include: { highlights: { orderBy: { sortOrder: 'asc' as const } } },
  },
};

export class AboutUsBannerRepository {
  async findBySiteId(siteId: string): Promise<AboutUsBannerConfigRecord | null> {
    const row = await prisma.aboutUsBannerConfig.findUnique({
      where: { siteId },
      include: includeNested,
    });
    return row ? mapRecord(row) : null;
  }

  async upsertBySiteId(
    siteId: string,
    data: AboutUsBannerConfigUpsertData,
  ): Promise<AboutUsBannerConfigRecord> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.aboutUsBannerConfig.findUnique({
        where: { siteId },
        select: { id: true },
      });

      const config = existing
        ? await tx.aboutUsBannerConfig.update({
            where: { siteId },
            data: {
              promoLabel: data.promoLabel,
              promoHeading: data.promoHeading,
              promoSubheading: data.promoSubheading,
              promoButtonLabel: data.promoButtonLabel,
              promoButtonUrl: data.promoButtonUrl,
              servicesHeading: data.servicesHeading,
              servicesViewAllLabel: data.servicesViewAllLabel,
              servicesViewAllUrl: data.servicesViewAllUrl,
            },
          })
        : await tx.aboutUsBannerConfig.create({
            data: {
              siteId,
              promoLabel: data.promoLabel,
              promoHeading: data.promoHeading,
              promoSubheading: data.promoSubheading,
              promoButtonLabel: data.promoButtonLabel,
              promoButtonUrl: data.promoButtonUrl,
              servicesHeading: data.servicesHeading,
              servicesViewAllLabel: data.servicesViewAllLabel,
              servicesViewAllUrl: data.servicesViewAllUrl,
            },
          });

      await tx.aboutUsAboutCard.deleteMany({ where: { configId: config.id } });
      await tx.aboutUsHighlightItem.deleteMany({ where: { configId: config.id } });
      await tx.aboutUsTextSlide.deleteMany({ where: { configId: config.id } });
      await tx.aboutUsService.deleteMany({ where: { configId: config.id } });

      if (data.aboutCards.length > 0) {
        await tx.aboutUsAboutCard.createMany({
          data: data.aboutCards.map((card) => ({
            configId: config.id,
            ...card,
          })),
        });
      }

      if (data.highlightItems.length > 0) {
        await tx.aboutUsHighlightItem.createMany({
          data: data.highlightItems.map((item) => ({
            configId: config.id,
            ...item,
          })),
        });
      }

      if (data.textSlides.length > 0) {
        await tx.aboutUsTextSlide.createMany({
          data: data.textSlides.map((slide) => ({
            configId: config.id,
            ...slide,
          })),
        });
      }

      const services = data.services ?? [];
      if (services.length > 0) {
        for (const service of services) {
          await tx.aboutUsService.create({
            data: {
              configId: config.id,
              imageUrl: service.imageUrl,
              imagePublicId: service.imagePublicId,
              buttonLabel: service.buttonLabel,
              heading: service.heading,
              description: service.description,
              doctorImageUrl: service.doctorImageUrl,
              doctorImagePublicId: service.doctorImagePublicId,
              doctorName: service.doctorName,
              doctorDesignation: service.doctorDesignation,
              doctorButtonLabel: service.doctorButtonLabel,
              doctorButtonUrl: service.doctorButtonUrl,
              sortOrder: service.sortOrder,
              active: service.active,
              highlights: { create: service.highlights },
            },
          });
        }
      }

      const row = await tx.aboutUsBannerConfig.findUniqueOrThrow({
        where: { id: config.id },
        include: includeNested,
      });

      return mapRecord(row);
    });
  }
}

export const aboutUsBannerRepository = new AboutUsBannerRepository();

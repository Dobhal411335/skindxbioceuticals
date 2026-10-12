import { prisma } from '@/lib/prisma';
import type {
  HeroBannerSlideRecord,
  HeroBannerSlideWrite,
} from './hero-banner.types';

function mapRecord(row: {
  id: string;
  siteId: string;
  layoutType: HeroBannerSlideRecord['layoutType'];
  order: number;
  active: boolean;
  mobileImageUrl: string;
  mobileImagePublicId: string;
  desktopImageUrl: string;
  desktopImagePublicId: string;
  miniHeading: string;
  mainHeading: string;
  description: string;
  buttonLabel: string;
  buttonUrl: string;
  button2Label: string;
  button2Url: string;
  leftImageUrl: string;
  leftImagePublicId: string;
  rightImageUrl: string;
  rightImagePublicId: string;
  gridImages: Array<{
    id: string;
    slideId: string;
    imageUrl: string;
    imagePublicId: string;
    alt: string;
    order: number;
  }>;
}): HeroBannerSlideRecord {
  return {
    id: row.id,
    siteId: row.siteId,
    layoutType: row.layoutType,
    order: row.order,
    active: row.active,
    mobileImageUrl: row.mobileImageUrl,
    mobileImagePublicId: row.mobileImagePublicId,
    desktopImageUrl: row.desktopImageUrl,
    desktopImagePublicId: row.desktopImagePublicId,
    miniHeading: row.miniHeading,
    mainHeading: row.mainHeading,
    description: row.description,
    buttonLabel: row.buttonLabel,
    buttonUrl: row.buttonUrl,
    button2Label: row.button2Label,
    button2Url: row.button2Url,
    leftImageUrl: row.leftImageUrl,
    leftImagePublicId: row.leftImagePublicId,
    rightImageUrl: row.rightImageUrl,
    rightImagePublicId: row.rightImagePublicId,
    gridImages: row.gridImages.map((image) => ({
      id: image.id,
      slideId: image.slideId,
      imageUrl: image.imageUrl,
      imagePublicId: image.imagePublicId,
      alt: image.alt,
      order: image.order,
    })),
  };
}

const includeGrid = {
  gridImages: { orderBy: { order: 'asc' as const } },
};

export class HeroBannerRepository {
  async listBySiteId(siteId: string): Promise<HeroBannerSlideRecord[]> {
    const rows = await prisma.heroBannerSlide.findMany({
      where: { siteId },
      include: includeGrid,
      orderBy: { order: 'asc' },
    });
    return rows.map(mapRecord);
  }

  async replaceBySiteId(
    siteId: string,
    slides: HeroBannerSlideWrite[],
  ): Promise<HeroBannerSlideRecord[]> {
    return prisma.$transaction(async (tx) => {
      await tx.heroBannerSlide.deleteMany({ where: { siteId } });

      for (const slide of slides) {
        await tx.heroBannerSlide.create({
          data: {
            siteId,
            layoutType: slide.layoutType,
            order: slide.order,
            active: slide.active,
            mobileImageUrl: slide.mobileImageUrl,
            mobileImagePublicId: slide.mobileImagePublicId,
            desktopImageUrl: slide.desktopImageUrl,
            desktopImagePublicId: slide.desktopImagePublicId,
            miniHeading: slide.miniHeading,
            mainHeading: slide.mainHeading,
            description: slide.description,
            buttonLabel: slide.buttonLabel,
            buttonUrl: slide.buttonUrl,
            button2Label: slide.button2Label,
            button2Url: slide.button2Url,
            leftImageUrl: slide.leftImageUrl,
            leftImagePublicId: slide.leftImagePublicId,
            rightImageUrl: slide.rightImageUrl,
            rightImagePublicId: slide.rightImagePublicId,
            gridImages: {
              create: slide.gridImages.map((image) => ({
                imageUrl: image.imageUrl,
                imagePublicId: image.imagePublicId,
                alt: image.alt,
                order: image.order,
              })),
            },
          },
        });
      }

      const rows = await tx.heroBannerSlide.findMany({
        where: { siteId },
        include: includeGrid,
        orderBy: { order: 'asc' },
      });

      return rows.map(mapRecord);
    });
  }
}

export const heroBannerRepository = new HeroBannerRepository();

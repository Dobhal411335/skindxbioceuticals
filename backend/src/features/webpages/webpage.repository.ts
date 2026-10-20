import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type {
  WebpageContentWrite,
  WebpageCreateWrite,
  WebpageMetaPatchWrite,
  WebpageRecord,
} from './webpage.types';

function mapWebpage(row: {
  id: string;
  siteId: string;
  title: string;
  slug: string;
  active: boolean;
  templateType: string;
  titleLine: string;
  keywords: string[];
  firstTitle: string;
  secondTitle: string;
  imageFirst: Prisma.JsonValue | null;
  imageFirstMobile: Prisma.JsonValue | null;
  bannerImage: Prisma.JsonValue | null;
  bannerImageMobile: Prisma.JsonValue | null;
  paragraphFirstImage: Prisma.JsonValue | null;
  paragraphSecondImage: Prisma.JsonValue | null;
  advertisementImage: Prisma.JsonValue | null;
  sideThumbImage: Prisma.JsonValue | null;
  mainProfileImage: Prisma.JsonValue | null;
  createTags: Prisma.JsonValue;
  postedBy: Prisma.JsonValue;
  highlights: Prisma.JsonValue;
  paragraphSections: Prisma.JsonValue;
  tableTitle: string;
  tableRows: Prisma.JsonValue;
  blockquoteMainTitle: string;
  blockquoteLeftTitle: string;
  blockquoteDescription: string;
  blockquoteTags: Prisma.JsonValue;
  accordionTags: Prisma.JsonValue;
  advertisements: Prisma.JsonValue;
  advertisementUrl: string;
  sideThumbName: string;
  sideThumbDesignation: string;
  sideThumbDescription: string;
  facebookUrl: string;
  youtubeUrl: string;
  instaUrl: string;
  googleUrl: string;
  imageGallery: Prisma.JsonValue;
  notices: Prisma.JsonValue;
  searchLocations: Prisma.JsonValue;
  design5Chip: string;
  design5MainHeading: string;
  gridCards: Prisma.JsonValue;
  design6Chip: string;
  design6ExploreLink: string;
  design6MainHeading: string;
  design6SubHeading: string;
  design6Author: string;
  design6MidHeading: string;
  design6MidLink: string;
  teamCards: Prisma.JsonValue;
  design7Chip: string;
  design7ExploreLink: string;
  design7MainHeading: string;
  design9MiniHeading: string;
  design9MainHeading: string;
  design9Description: string;
  design9Cards: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}): WebpageRecord {
  return { ...row };
}

export class WebpageRepository {
  async listBySiteId(
    siteId: string,
    options?: { activeOnly?: boolean },
  ): Promise<WebpageRecord[]> {
    const rows = await prisma.webpage.findMany({
      where: {
        siteId,
        ...(options?.activeOnly ? { active: true } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapWebpage);
  }

  async findByIdForSite(siteId: string, webpageId: string): Promise<WebpageRecord | null> {
    const row = await prisma.webpage.findFirst({
      where: { id: webpageId, siteId },
    });
    return row ? mapWebpage(row) : null;
  }

  async findBySlugForSite(
    siteId: string,
    slug: string,
    activeOnly = false,
  ): Promise<WebpageRecord | null> {
    const row = await prisma.webpage.findFirst({
      where: {
        siteId,
        slug,
        ...(activeOnly ? { active: true } : {}),
      },
    });
    return row ? mapWebpage(row) : null;
  }

  async slugExists(siteId: string, slug: string, excludeId?: string): Promise<boolean> {
    const row = await prisma.webpage.findFirst({
      where: {
        siteId,
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return Boolean(row);
  }

  async create(siteId: string, data: WebpageCreateWrite): Promise<WebpageRecord> {
    const row = await prisma.webpage.create({
      data: {
        siteId,
        title: data.title,
        slug: data.slug,
        active: data.active,
        templateType: data.templateType,
      },
    });
    return mapWebpage(row);
  }

  async patchMeta(
    siteId: string,
    webpageId: string,
    data: WebpageMetaPatchWrite,
  ): Promise<WebpageRecord | null> {
    const existing = await prisma.webpage.findFirst({
      where: { id: webpageId, siteId },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await prisma.webpage.update({
      where: { id: webpageId },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
        ...(data.templateType !== undefined ? { templateType: data.templateType } : {}),
      },
    });
    return mapWebpage(row);
  }

  async updateContent(
    siteId: string,
    webpageId: string,
    data: WebpageContentWrite,
  ): Promise<WebpageRecord | null> {
    const existing = await prisma.webpage.findFirst({
      where: { id: webpageId, siteId },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await prisma.webpage.update({
      where: { id: webpageId },
      data: data as Prisma.WebpageUpdateInput,
    });
    return mapWebpage(row);
  }

  async delete(siteId: string, webpageId: string): Promise<boolean> {
    const existing = await prisma.webpage.findFirst({
      where: { id: webpageId, siteId },
      select: { id: true },
    });
    if (!existing) return false;
    await prisma.webpage.delete({ where: { id: webpageId } });
    return true;
  }
}

export const webpageRepository = new WebpageRepository();

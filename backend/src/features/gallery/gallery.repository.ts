import type { GalleryMediaType as PrismaGalleryMediaType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type {
  GalleryItemRecord,
  GalleryItemWrite,
  GalleryMediaTypePrisma,
} from './gallery.types';

function mapItem(row: {
  id: string;
  siteId: string;
  mediaType: string;
  mediaUrl: string;
  mediaPublicId: string;
  clickUrl: string;
  heading: string;
  description: string;
  buttonLabel: string;
  buttonUrl: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): GalleryItemRecord {
  return {
    id: row.id,
    siteId: row.siteId,
    mediaType: row.mediaType as GalleryMediaTypePrisma,
    mediaUrl: row.mediaUrl,
    mediaPublicId: row.mediaPublicId,
    clickUrl: row.clickUrl,
    heading: row.heading,
    description: row.description,
    buttonLabel: row.buttonLabel,
    buttonUrl: row.buttonUrl,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toClientMediaType(value: GalleryMediaTypePrisma): PrismaGalleryMediaType {
  return value as PrismaGalleryMediaType;
}

export class GalleryRepository {
  async listBySiteId(
    siteId: string,
    mediaType?: GalleryMediaTypePrisma,
  ): Promise<GalleryItemRecord[]> {
    const rows = await prisma.galleryItem.findMany({
      where: {
        siteId,
        ...(mediaType !== undefined ? { mediaType: toClientMediaType(mediaType) } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapItem);
  }

  async listActiveBySiteId(siteId: string): Promise<GalleryItemRecord[]> {
    const rows = await prisma.galleryItem.findMany({
      where: { siteId, active: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapItem);
  }

  async findByIdForSite(siteId: string, itemId: string): Promise<GalleryItemRecord | null> {
    const row = await prisma.galleryItem.findFirst({
      where: { id: itemId, siteId },
    });
    return row ? mapItem(row) : null;
  }

  async create(siteId: string, data: GalleryItemWrite): Promise<GalleryItemRecord> {
    const row = await prisma.galleryItem.create({
      data: {
        siteId,
        mediaType: toClientMediaType(data.mediaType),
        mediaUrl: data.mediaUrl,
        mediaPublicId: data.mediaPublicId,
        clickUrl: data.clickUrl,
        heading: data.heading,
        description: data.description,
        buttonLabel: data.buttonLabel,
        buttonUrl: data.buttonUrl,
        active: data.active,
      },
    });
    return mapItem(row);
  }

  async update(
    siteId: string,
    itemId: string,
    data: GalleryItemWrite,
  ): Promise<GalleryItemRecord | null> {
    const existing = await prisma.galleryItem.findFirst({
      where: { id: itemId, siteId },
      select: { id: true },
    });
    if (!existing) {
      return null;
    }

    const row = await prisma.galleryItem.update({
      where: { id: itemId },
      data: {
        mediaType: toClientMediaType(data.mediaType),
        mediaUrl: data.mediaUrl,
        mediaPublicId: data.mediaPublicId,
        clickUrl: data.clickUrl,
        heading: data.heading,
        description: data.description,
        buttonLabel: data.buttonLabel,
        buttonUrl: data.buttonUrl,
        active: data.active,
      },
    });
    return mapItem(row);
  }

  async patch(
    siteId: string,
    itemId: string,
    data: { active: boolean },
  ): Promise<GalleryItemRecord | null> {
    const existing = await prisma.galleryItem.findFirst({
      where: { id: itemId, siteId },
      select: { id: true },
    });
    if (!existing) {
      return null;
    }

    const row = await prisma.galleryItem.update({
      where: { id: itemId },
      data: { active: data.active },
    });
    return mapItem(row);
  }

  async delete(siteId: string, itemId: string): Promise<boolean> {
    const existing = await prisma.galleryItem.findFirst({
      where: { id: itemId, siteId },
      select: { id: true },
    });
    if (!existing) {
      return false;
    }
    await prisma.galleryItem.delete({ where: { id: itemId } });
    return true;
  }
}

export const galleryRepository = new GalleryRepository();

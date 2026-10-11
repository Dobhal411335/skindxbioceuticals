import type { GalleryMediaType as PrismaGalleryMediaType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { GalleryItemRecord, GalleryItemWrite } from './gallery.types';

function mapItem(row: {
  id: string;
  siteId: string;
  mediaType: PrismaGalleryMediaType;
  mediaUrl: string;
  mediaPublicId: string;
  title: string;
  caption: string;
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}): GalleryItemRecord {
  return {
    id: row.id,
    siteId: row.siteId,
    mediaType: row.mediaType,
    mediaUrl: row.mediaUrl,
    mediaPublicId: row.mediaPublicId,
    title: row.title,
    caption: row.caption,
    active: row.active,
    order: row.order,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class GalleryRepository {
  async listBySiteId(
    siteId: string,
    mediaType?: PrismaGalleryMediaType,
  ): Promise<GalleryItemRecord[]> {
    const rows = await prisma.galleryItem.findMany({
      where: {
        siteId,
        ...(mediaType !== undefined ? { mediaType } : {}),
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    return rows.map(mapItem);
  }

  async listActiveBySiteId(siteId: string): Promise<GalleryItemRecord[]> {
    const rows = await prisma.galleryItem.findMany({
      where: { siteId, active: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    return rows.map(mapItem);
  }

  async findByIdForSite(siteId: string, itemId: string): Promise<GalleryItemRecord | null> {
    const row = await prisma.galleryItem.findFirst({
      where: { id: itemId, siteId },
    });
    return row ? mapItem(row) : null;
  }

  async nextOrder(siteId: string): Promise<number> {
    const last = await prisma.galleryItem.findFirst({
      where: { siteId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    return (last?.order ?? 0) + 1;
  }

  async create(siteId: string, data: GalleryItemWrite): Promise<GalleryItemRecord> {
    const row = await prisma.galleryItem.create({
      data: {
        siteId,
        mediaType: data.mediaType,
        mediaUrl: data.mediaUrl,
        mediaPublicId: data.mediaPublicId,
        title: data.title,
        caption: data.caption,
        active: data.active,
        order: data.order,
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
        mediaType: data.mediaType,
        mediaUrl: data.mediaUrl,
        mediaPublicId: data.mediaPublicId,
        title: data.title,
        caption: data.caption,
        active: data.active,
        order: data.order,
      },
    });
    return mapItem(row);
  }

  async patch(
    siteId: string,
    itemId: string,
    data: { active?: boolean; order?: number },
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
        ...(data.active !== undefined ? { active: data.active } : {}),
        ...(data.order !== undefined ? { order: data.order } : {}),
      },
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

import {
  deleteStoredCloudinaryAsset,
  deleteStoredCloudinaryAssetBestEffort,
  mediaTypeToCloudinaryResourceType,
} from '@/lib/cloudinary';
import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { NotFoundError } from '@/utils/AppError';
import { galleryRepository } from './gallery.repository';
import type { GalleryItemBody, GalleryItemPatchBody } from './gallery.validation';
import type {
  GalleryItemDto,
  GalleryItemRecord,
  GalleryItemWrite,
  GalleryMediaTypeDto,
  SiteCodeDto,
} from './gallery.types';
import { toDtoMediaType, toPrismaMediaType } from './gallery.types';

function preferHttpsUrl(url: string): string {
  if (url.startsWith('http://res.cloudinary.com/')) {
    return `https://${url.slice('http://'.length)}`;
  }
  return url;
}

export function toGalleryItemDto(record: GalleryItemRecord, siteCode: SiteCodeDto): GalleryItemDto {
  return {
    id: record.id,
    siteCode,
    mediaType: toDtoMediaType(record.mediaType),
    mediaUrl: preferHttpsUrl(record.mediaUrl),
    mediaPublicId: record.mediaPublicId,
    title: record.title,
    caption: record.caption,
    active: record.active,
    order: record.order,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function bodyToWrite(body: GalleryItemBody, fallbackOrder: number): GalleryItemWrite {
  return {
    mediaType: toPrismaMediaType(body.mediaType),
    mediaUrl: preferHttpsUrl(body.mediaUrl),
    mediaPublicId: body.mediaPublicId ?? '',
    title: body.title ?? '',
    caption: body.caption ?? '',
    active: body.active,
    order: body.order ?? fallbackOrder,
  };
}

export class GalleryService {
  constructor(private readonly repository = galleryRepository) {}

  async listForSite(
    siteId: string,
    siteCode: SiteCode,
    mediaType?: GalleryMediaTypeDto,
  ): Promise<GalleryItemDto[]> {
    const rows = await this.repository.listBySiteId(
      siteId,
      mediaType ? toPrismaMediaType(mediaType) : undefined,
    );
    return rows.map((row) => toGalleryItemDto(row, siteCode));
  }

  async listActiveForSite(siteId: string, siteCode: SiteCode): Promise<GalleryItemDto[]> {
    const rows = await this.repository.listActiveBySiteId(siteId);
    return rows.map((row) => toGalleryItemDto(row, siteCode));
  }

  async createForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    body: GalleryItemBody;
  }): Promise<GalleryItemDto> {
    const nextOrder = await this.repository.nextOrder(input.siteId);
    const data = bodyToWrite(input.body, nextOrder);
    const record = await this.repository.create(input.siteId, data);

    logger.info(
      {
        event: 'gallery_item.created',
        siteCode: input.siteCode,
        userId: input.userId,
        galleryItemId: record.id,
        mediaType: input.body.mediaType,
      },
      'Gallery item created',
    );

    return toGalleryItemDto(record, input.siteCode);
  }

  async updateForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    itemId: string;
    body: GalleryItemBody;
  }): Promise<GalleryItemDto> {
    const existing = await this.repository.findByIdForSite(input.siteId, input.itemId);
    if (!existing) {
      throw new NotFoundError('Gallery item not found');
    }

    const data = bodyToWrite(input.body, existing.order);
    const record = await this.repository.update(input.siteId, input.itemId, data);
    if (!record) {
      throw new NotFoundError('Gallery item not found');
    }

    const previousPublicId = existing.mediaPublicId.trim();
    const nextPublicId = data.mediaPublicId.trim();
    if (previousPublicId && previousPublicId !== nextPublicId) {
      await deleteStoredCloudinaryAssetBestEffort(previousPublicId, {
        resourceType: mediaTypeToCloudinaryResourceType(existing.mediaType),
      });
    }

    logger.info(
      {
        event: 'gallery_item.updated',
        siteCode: input.siteCode,
        userId: input.userId,
        galleryItemId: record.id,
        mediaType: input.body.mediaType,
      },
      'Gallery item updated',
    );

    return toGalleryItemDto(record, input.siteCode);
  }

  async patchForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    itemId: string;
    body: GalleryItemPatchBody;
  }): Promise<GalleryItemDto> {
    const record = await this.repository.patch(input.siteId, input.itemId, input.body);
    if (!record) {
      throw new NotFoundError('Gallery item not found');
    }

    logger.info(
      {
        event: 'gallery_item.patched',
        siteCode: input.siteCode,
        userId: input.userId,
        galleryItemId: record.id,
        active: record.active,
        order: record.order,
      },
      'Gallery item patched',
    );

    return toGalleryItemDto(record, input.siteCode);
  }

  async deleteForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    itemId: string;
  }): Promise<void> {
    const existing = await this.repository.findByIdForSite(input.siteId, input.itemId);
    if (!existing) {
      throw new NotFoundError('Gallery item not found');
    }

    if (existing.mediaPublicId.trim()) {
      await deleteStoredCloudinaryAsset(existing.mediaPublicId, {
        resourceType: mediaTypeToCloudinaryResourceType(existing.mediaType),
      });
    }

    const deleted = await this.repository.delete(input.siteId, input.itemId);
    if (!deleted) {
      throw new NotFoundError('Gallery item not found');
    }

    logger.info(
      {
        event: 'gallery_item.deleted',
        siteCode: input.siteCode,
        userId: input.userId,
        galleryItemId: input.itemId,
      },
      'Gallery item deleted',
    );
  }
}

export const galleryService = new GalleryService();

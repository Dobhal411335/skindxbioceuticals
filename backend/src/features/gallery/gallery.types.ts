import type { GalleryMediaType as PrismaGalleryMediaType } from '@prisma/client';
import type { SiteCode } from '@/types/common';

export type SiteCodeDto = SiteCode;

/** API / DTO media type (lowercase). */
export type GalleryMediaTypeDto = 'image' | 'video';

export type GalleryItemDto = {
  id: string;
  siteCode: SiteCodeDto;
  mediaType: GalleryMediaTypeDto;
  mediaUrl: string;
  mediaPublicId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GalleryItemRecord = {
  id: string;
  siteId: string;
  mediaType: PrismaGalleryMediaType;
  mediaUrl: string;
  mediaPublicId: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type GalleryItemWrite = {
  mediaType: PrismaGalleryMediaType;
  mediaUrl: string;
  mediaPublicId: string;
  active: boolean;
};

export function toPrismaMediaType(value: GalleryMediaTypeDto): PrismaGalleryMediaType {
  return value === 'video' ? 'VIDEO' : 'IMAGE';
}

export function toDtoMediaType(value: PrismaGalleryMediaType): GalleryMediaTypeDto {
  return value === 'VIDEO' ? 'video' : 'image';
}

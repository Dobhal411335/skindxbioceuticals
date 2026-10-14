import type { SiteCode } from '@/types/common';

export type SiteCodeDto = SiteCode;

/** Prisma / DB enum values. */
export type GalleryMediaTypePrisma = 'IMAGE' | 'VIDEO' | 'TEXT_CARD';

/** API / DTO media type (lowercase). */
export type GalleryMediaTypeDto = 'image' | 'video' | 'text_card';

export type GalleryItemDto = {
  id: string;
  siteCode: SiteCodeDto;
  mediaType: GalleryMediaTypeDto;
  mediaUrl: string;
  mediaPublicId: string;
  clickUrl: string;
  heading: string;
  description: string;
  buttonLabel: string;
  buttonUrl: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GalleryItemRecord = {
  id: string;
  siteId: string;
  mediaType: GalleryMediaTypePrisma;
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
};

export type GalleryItemWrite = {
  mediaType: GalleryMediaTypePrisma;
  mediaUrl: string;
  mediaPublicId: string;
  clickUrl: string;
  heading: string;
  description: string;
  buttonLabel: string;
  buttonUrl: string;
  active: boolean;
};

export function toPrismaMediaType(value: GalleryMediaTypeDto): GalleryMediaTypePrisma {
  if (value === 'video') return 'VIDEO';
  if (value === 'text_card') return 'TEXT_CARD';
  return 'IMAGE';
}

export function toDtoMediaType(value: GalleryMediaTypePrisma): GalleryMediaTypeDto {
  if (value === 'VIDEO') return 'video';
  if (value === 'TEXT_CARD') return 'text_card';
  return 'image';
}

export function isGalleryMediaAsset(
  mediaType: GalleryMediaTypePrisma | GalleryMediaTypeDto,
): boolean {
  return (
    mediaType === 'IMAGE' ||
    mediaType === 'VIDEO' ||
    mediaType === 'image' ||
    mediaType === 'video'
  );
}

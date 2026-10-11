import type { SocialPostType as PrismaSocialPostType } from '@prisma/client';
import type { SiteCode } from '@/types/common';

export type SiteCodeDto = SiteCode;

/** API / DTO post type (lowercase, matches storefront + admin UX). */
export type SocialPostTypeDto = 'instagram' | 'facebook';

export type SocialPostDto = {
  id: string;
  siteCode: SiteCodeDto;
  postType: SocialPostTypeDto;
  imageUrl: string;
  imagePublicId: string;
  postUrl: string;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type SocialPostRecord = {
  id: string;
  siteId: string;
  postType: PrismaSocialPostType;
  imageUrl: string;
  imagePublicId: string;
  postUrl: string;
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

export type SocialPostWrite = {
  postType: PrismaSocialPostType;
  imageUrl: string;
  imagePublicId: string;
  postUrl: string;
  active: boolean;
  order: number;
};

export function toPrismaPostType(value: SocialPostTypeDto): PrismaSocialPostType {
  return value === 'facebook' ? 'FACEBOOK' : 'INSTAGRAM';
}

export function toDtoPostType(value: PrismaSocialPostType): SocialPostTypeDto {
  return value === 'FACEBOOK' ? 'facebook' : 'instagram';
}

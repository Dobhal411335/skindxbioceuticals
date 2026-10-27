import type { SiteCode } from '@/types/common';

export type SiteCodeDto = SiteCode;

export type BlogDto = {
  id: string;
  siteCode: SiteCodeDto;
  name: string;
  slug: string;
  category: string;
  badgeText?: string;
  stat1Number?: string;
  stat1Name?: string;
  stat1Text?: string;
  stat2Number?: string;
  stat2Name?: string;
  stat2Text?: string;
  title: string;
  publishedAt: string;
  createdBy: string;
  imageUrl: string;
  imagePublicId: string;
  description: string;
  blockquote: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BlogPublicDto = {
  id: string;
  siteCode: SiteCodeDto;
  name: string;
  slug: string;
  category: string;
  badgeText?: string;
  stat1Number?: string;
  stat1Name?: string;
  stat1Text?: string;
  stat2Number?: string;
  stat2Name?: string;
  stat2Text?: string;
  title: string;
  publishedAt: string;
  createdBy: string;
  imageUrl: string;
  description: string;
  blockquote: string;
  createdAt: string;
};

/** Lightweight card for related / recent lists (no HTML body). */
export type BlogCardDto = {
  id: string;
  slug: string;
  name: string;
  category: string;
  badgeText?: string;
  stat1Number?: string;
  stat1Name?: string;
  stat1Text?: string;
  stat2Number?: string;
  stat2Name?: string;
  stat2Text?: string;
  title: string;
  publishedAt: string;
  createdBy: string;
  imageUrl: string;
};

export type BlogDetailPublicDto = BlogPublicDto & {
  related: BlogCardDto[];
};

export type BlogRecord = {
  id: string;
  siteId: string;
  name: string;
  slug: string;
  category: string;
  badgeText?: string;
  stat1Number?: string;
  stat1Name?: string;
  stat1Text?: string;
  stat2Number?: string;
  stat2Name?: string;
  stat2Text?: string;
  title: string;
  publishedAt: Date;
  createdBy: string;
  imageUrl: string;
  imagePublicId: string;
  description: string;
  blockquote: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type BlogCreateWrite = {
  name: string;
  slug: string;
  category: string;
  badgeText?: string;
  stat1Number?: string;
  stat1Name?: string;
  stat1Text?: string;
  stat2Number?: string;
  stat2Name?: string;
  stat2Text?: string;
  title: string;
  publishedAt: Date;
  createdBy: string;
  imageUrl: string;
  imagePublicId: string;
  description: string;
  blockquote: string;
  active: boolean;
};

export type BlogUpdateWrite = {
  name: string;
  slug: string;
  category: string;
  badgeText?: string;
  stat1Number?: string;
  stat1Name?: string;
  stat1Text?: string;
  stat2Number?: string;
  stat2Name?: string;
  stat2Text?: string;
  title: string;
  publishedAt: Date;
  createdBy: string;
  imageUrl: string;
  imagePublicId: string;
  description: string;
  blockquote: string;
  active: boolean;
};

export type BlogPatchWrite = {
  name?: string;
  active?: boolean;
};

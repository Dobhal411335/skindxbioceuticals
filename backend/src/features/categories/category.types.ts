import type { SiteCode } from '@/types/common';

export type SiteCodeDto = SiteCode;

export type CategoryRecord = {
  id: string;
  siteId: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  bannerUrl: string | null;
  bannerPublicId: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CategoryWrite = {
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  bannerUrl: string | null;
  bannerPublicId: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type CategoryDto = {
  id: string;
  siteCode: SiteCodeDto;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  bannerUrl: string | null;
  bannerPublicId: string | null;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type CatalogProductSummaryDto = {
  id: string;
  productCode: string;
  name: string;
  slug: string;
  active: boolean;
};

export type PublicSubcategoryDto = {
  id: string;
  name: string;
  slug: string;
  order: number;
  products: CatalogProductSummaryDto[];
};

export type PublicCategoryDto = {
  id: string;
  siteCode: SiteCodeDto;
  name: string;
  slug: string;
  bannerUrl: string | null;
  order: number;
};

export type PublicCategoryDetailDto = PublicCategoryDto & {
  description: string | null;
  subcategories: PublicSubcategoryDto[];
};

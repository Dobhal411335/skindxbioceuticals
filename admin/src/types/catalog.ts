import type { SiteCode } from "@/types/auth";

export type CategoryDto = {
  id: string;
  siteCode: SiteCode;
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

export type CategoryFormValues = {
  name: string;
  active: boolean;
};

export type CategoryPayload = {
  name: string;
  active: boolean;
};

export type SubcategoryFormValues = {
  name: string;
  bannerUrl: string;
  bannerPublicId: string;
  active: boolean;
};

export type SubcategoryPayload = {
  name: string;
  bannerUrl: string;
  bannerPublicId: string;
  active: boolean;
};

export type CatalogProductDto = {
  id: string;
  siteCode: SiteCode;
  subcategoryId: string | null;
  productCode: string;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
  isFeatured: boolean;
  isRecent: boolean;
  isBestSeller: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CatalogProductFormValues = {
  productCode: string;
  name: string;
  active: boolean;
  isFeatured: boolean;
  isRecent: boolean;
  isBestSeller: boolean;
};

export type CatalogProductPayload = {
  productCode: string;
  name: string;
  active: boolean;
  isFeatured: boolean;
  isRecent: boolean;
  isBestSeller: boolean;
};

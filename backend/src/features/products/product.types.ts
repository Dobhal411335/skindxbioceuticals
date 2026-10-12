import type { ProductStatus } from '@prisma/client';
import type { SiteCode } from '@/types/common';

export type SiteCodeDto = SiteCode;

export type ProductRecord = {
  id: string;
  siteId: string;
  subcategoryId: string | null;
  productCode: string;
  name: string;
  slug: string;
  description: string | null;
  status: ProductStatus;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductWrite = {
  subcategoryId: string;
  productCode: string;
  name: string;
  slug: string;
  description: string | null;
  status: ProductStatus;
  isFeatured: boolean;
};

export type CatalogProductDto = {
  id: string;
  siteCode: SiteCodeDto;
  subcategoryId: string | null;
  productCode: string;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
};

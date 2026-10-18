import type { ProductStatus } from '@prisma/client';
import type { SiteCode } from '@/types/common';

export type SiteCodeDto = SiteCode;

/** One variant row for stock list / qty modal. */
export type AdminStockVariantDto = {
  id: string;
  name: string;
  sizeLabel: string | null;
  colorLabel: string | null;
  quantity: number;
  isActive: boolean;
};

/**
 * Admin Stock Management table row.
 * `isSimpleOffer` is true when there are no variants or a single base offer
 * (no size/color labels) — the UI shows one product qty in that case.
 */
export type AdminStockListItemDto = {
  id: string;
  siteCode: SiteCodeDto;
  productCode: string;
  name: string;
  status: ProductStatus;
  imageUrl: string | null;
  price: number | null;
  vendorPrice: number | null;
  currency: string;
  subcategoryId: string | null;
  subcategoryName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  isSimpleOffer: boolean;
  /** Product-level qty for simple offers; sum is not used for multi-variant. */
  quantity: number;
  variants: AdminStockVariantDto[];
  updatedAt: string;
};

export type AdminStockListMetaDto = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminStockListResultDto = {
  items: AdminStockListItemDto[];
  meta: AdminStockListMetaDto;
};

export type AdminStockVariantUpdateResultDto = {
  productId: string;
  variantId: string;
  quantity: number;
};

import type { ProductStatus } from '@prisma/client';
import type { SiteCode } from '@/types/common';

export type SiteCodeDto = SiteCode;

/** One variant row for price preview / apply results. */
export type AdminProductPriceVariantDto = {
  id: string;
  name: string;
  sizeLabel: string | null;
  colorLabel: string | null;
  isActive: boolean;
  /** Selling / list price (ProductVariant.price). */
  price: number;
  /** Projected selling price after percent (null when percent omitted). */
  updatedPrice: number | null;
  vendorPrice: number | null;
  updatedVendorPrice: number | null;
  compareAtPrice: number | null;
  updatedCompareAtPrice: number | null;
  currency: string;
};

/**
 * Admin Update Product Prices table row.
 * Prices live on variants; product-level price/vendor mirror the first variant
 * for simple offers (same convention as stock management).
 */
export type AdminProductPriceListItemDto = {
  id: string;
  siteCode: SiteCodeDto;
  productCode: string;
  name: string;
  status: ProductStatus;
  imageUrl: string | null;
  subcategoryId: string | null;
  subcategoryName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  isSimpleOffer: boolean;
  /** First-variant selling price (list convenience). */
  price: number | null;
  updatedPrice: number | null;
  vendorPrice: number | null;
  updatedVendorPrice: number | null;
  currency: string;
  variants: AdminProductPriceVariantDto[];
  updatedAt: string;
};

export type AdminProductPriceListMetaDto = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminProductPriceListResultDto = {
  items: AdminProductPriceListItemDto[];
  meta: AdminProductPriceListMetaDto;
};

export type AdminProductPriceApplyResultDto = {
  percent: number;
  productsUpdated: number;
  variantsUpdated: number;
  items: AdminProductPriceListItemDto[];
};

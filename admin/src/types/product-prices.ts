import type { SiteCode } from "@/types/auth";

export type AdminProductPriceStatusFilter =
  | "all"
  | "active"
  | "draft"
  | "archived";

export type AdminProductPriceProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type AdminProductPriceVariantDto = {
  id: string;
  name: string;
  sizeLabel: string | null;
  colorLabel: string | null;
  isActive: boolean;
  price: number;
  updatedPrice: number | null;
  vendorPrice: number | null;
  updatedVendorPrice: number | null;
  compareAtPrice: number | null;
  updatedCompareAtPrice: number | null;
  currency: string;
};

export type AdminProductPriceListItemDto = {
  id: string;
  siteCode: SiteCode;
  productCode: string;
  name: string;
  status: AdminProductPriceProductStatus;
  imageUrl: string | null;
  subcategoryId: string | null;
  subcategoryName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  isSimpleOffer: boolean;
  price: number | null;
  updatedPrice: number | null;
  vendorPrice: number | null;
  updatedVendorPrice: number | null;
  currency: string;
  variants: AdminProductPriceVariantDto[];
  updatedAt: string;
};

export type AdminProductPriceListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminProductPriceListResult = {
  items: AdminProductPriceListItemDto[];
  meta: AdminProductPriceListMeta;
};

export type AdminProductPriceListQuery = {
  q?: string;
  status?: AdminProductPriceStatusFilter;
  categoryId?: string;
  subcategoryId?: string;
  productId?: string;
  percent?: number;
  page?: number;
  offset?: number;
  limit?: number;
};

export type AdminProductPriceApplyBody = {
  percent: number;
  categoryId?: string;
  subcategoryId?: string;
  productId?: string;
  status?: AdminProductPriceStatusFilter;
  q?: string;
};

export type AdminProductPriceApplyResult = {
  percent: number;
  productsUpdated: number;
  variantsUpdated: number;
  items: AdminProductPriceListItemDto[];
};

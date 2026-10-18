import type { SiteCode } from "@/types/auth";

export type AdminStockStatusFilter =
  | "all"
  | "active"
  | "draft"
  | "archived";

export type AdminStockProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type AdminStockVariantDto = {
  id: string;
  name: string;
  sizeLabel: string | null;
  colorLabel: string | null;
  quantity: number;
  isActive: boolean;
};

export type AdminStockListItemDto = {
  id: string;
  siteCode: SiteCode;
  productCode: string;
  name: string;
  status: AdminStockProductStatus;
  imageUrl: string | null;
  price: number | null;
  vendorPrice: number | null;
  currency: string;
  subcategoryId: string | null;
  subcategoryName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  isSimpleOffer: boolean;
  quantity: number;
  variants: AdminStockVariantDto[];
  updatedAt: string;
};

export type AdminStockListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminStockListResult = {
  items: AdminStockListItemDto[];
  meta: AdminStockListMeta;
};

export type AdminStockListQuery = {
  q?: string;
  status?: AdminStockStatusFilter;
  categoryId?: string;
  subcategoryId?: string;
  page?: number;
  offset?: number;
  limit?: number;
};

export type AdminStockVariantUpdateResult = {
  productId: string;
  variantId: string;
  quantity: number;
};

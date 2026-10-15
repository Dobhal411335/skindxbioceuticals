export interface WishlistItemCouponDto {
  couponId: string;
  code: string;
  type: string;
  value: number;
}

export interface WishlistItemDto {
  id: string;
  productId: string;
  variantId: string | null;
  productName: string;
  productSlug: string;
  productCode: string;
  categoryName: string | null;
  imageUrl: string | null;
  price: string | null;
  currency: string | null;
  available: boolean;
  /** On-hand units (same display rule as product cards). */
  quantity: number;
  /** Product CGST % (0 when unset). */
  cgstPercent: number;
  /** Product SGST % (0 when unset). */
  sgstPercent: number;
  createdAt: string;
  /** Product-linked default discount coupon when active. */
  coupon: WishlistItemCouponDto | null;
}

export interface WishlistDto {
  id: string;
  items: WishlistItemDto[];
}

export type WishlistSyncSkipReason ="INVALID_PRODUCT"
  | "INACTIVE_OR_WRONG_SITE"
  | "INVALID_VARIANT";

export interface WishlistSyncSkippedItem {
  productId: string;
  variantId?: string | null;
  reason: WishlistSyncSkipReason;
}

export interface WishlistSyncResultDto {
  wishlist: WishlistDto;
  skipped: WishlistSyncSkippedItem[];
}

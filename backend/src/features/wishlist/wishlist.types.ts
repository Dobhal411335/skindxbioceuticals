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
  imageUrl: string | null;
  price: string | null;
  currency: string | null;
  available: boolean;
  /** Sellable units left (on hand − reserved). 0 when unknown / out of stock. */
  quantity: number;
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

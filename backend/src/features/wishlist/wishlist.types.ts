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
  createdAt: string;
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

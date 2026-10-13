export type WishlistItem = {
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
};

export type Wishlist = {
  id: string;
  items: WishlistItem[];
};

export type WishlistSyncSkipReason =
  | "INVALID_PRODUCT"
  | "INACTIVE_OR_WRONG_SITE"
  | "INVALID_VARIANT";

export type WishlistSyncSkippedItem = {
  productId: string;
  variantId?: string | null;
  reason: WishlistSyncSkipReason;
};

export type WishlistSyncPayload = {
  items: Array<{ productId: string; variantId?: string | null }>;
};

export type WishlistSyncResult = {
  wishlist: Wishlist;
  skipped: WishlistSyncSkippedItem[];
};

export type CartItemCoupon = {
  couponId: string;
  code: string;
  type: string;
  value: number;
} | null;

export type AccountCartItem = {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  productSlug: string;
  variantName: string;
  imageUrl: string | null;
  quantity: number;
  listPrice: string;
  unitPrice: string;
  discountAmount: string;
  discountCode: string | null;
  currency: string;
  availableQuantity: number;
  available: boolean;
  coupon: CartItemCoupon;
  createdAt: string;
  updatedAt: string;
};

export type AccountCart = {
  id: string;
  items: AccountCartItem[];
};

export type CartSyncSkipReason =
  | "INVALID_PRODUCT"
  | "INACTIVE_OR_WRONG_SITE"
  | "INVALID_VARIANT"
  | "OUT_OF_STOCK";

export type CartSyncSkippedItem = {
  productId: string;
  variantId?: string | null;
  reason: CartSyncSkipReason;
};

export type CartSyncPayload = {
  items: Array<{
    productId: string;
    variantId: string;
    quantity: number;
  }>;
};

export type CartSyncResult = {
  cart: AccountCart;
  skipped: CartSyncSkippedItem[];
};

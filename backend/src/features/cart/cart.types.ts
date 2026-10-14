export type CartItemCouponDto = {
  couponId: string;
  code: string;
  type: string;
  value: number;
} | null;

export type CartItemDto = {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  productSlug: string;
  variantName: string;
  imageUrl: string | null;
  quantity: number;
  /** List / catalogue unit price in rupees (string for Decimal safety). */
  listPrice: string;
  /** Payable unit price after product coupon in rupees. */
  unitPrice: string;
  /** Absolute per-unit discount in rupees. */
  discountAmount: string;
  discountCode: string | null;
  currency: string;
  availableQuantity: number;
  available: boolean;
  /** Product CGST % (0 when unset). */
  cgstPercent: number;
  /** Product SGST % (0 when unset). */
  sgstPercent: number;
  coupon: CartItemCouponDto;
  createdAt: string;
  updatedAt: string;
};

export type CartDto = {
  id: string;
  items: CartItemDto[];
};

export type CartSyncSkipReason =
  | 'INVALID_PRODUCT'
  | 'INACTIVE_OR_WRONG_SITE'
  | 'INVALID_VARIANT'
  | 'OUT_OF_STOCK';

export type CartSyncSkippedItem = {
  productId: string;
  variantId?: string | null;
  reason: CartSyncSkipReason;
};

export type CartSyncResultDto = {
  cart: CartDto;
  skipped: CartSyncSkippedItem[];
};

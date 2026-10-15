import type { ProductId } from "@/types/product";

export type CartItemId = string;

export type CartItem = {
  id: CartItemId;
  productId: ProductId;
  variantId?: string;
  slug: string;
  name: string;
  image: string;
  alt: string;
  /** Catalog subcategory label when known. */
  categoryName?: string | null;
  /** Site-scoped product code when known. */
  productCode?: string | null;
  variantLabel?: string;
  quantity: number;
  /** Payable unit price after product discount (if any). */
  unitPriceInPaise: number;
  /** List/original price before product discount. */
  originalUnitPriceInPaise?: number;
  /** Product-linked coupon code applied to this line. */
  discountCode?: string | null;
  /** Absolute discount amount per unit in paise. */
  discountInPaise?: number;
  /** Product CGST % (from catalog / account cart). */
  cgstPercent?: number;
  /** Product SGST % (from catalog / account cart). */
  sgstPercent?: number;
  /** Custom instructions / note for this specific item. */
  note?: string;
};

export type CartTotals = {
  subtotalInPaise: number;
  discountInPaise: number;
  shippingInPaise: number;
  taxInPaise: number;
  totalInPaise: number;
  giftWrapInPaise: number;
};

export type CartExtrasState = {
  notes: string;
  giftWrap: boolean;
  couponCode: string;
  appliedCoupon: string | null;
  termsAccepted: boolean;
};

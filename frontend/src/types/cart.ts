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
  variantLabel?: string;
  quantity: number;
  unitPriceInPaise: number;
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

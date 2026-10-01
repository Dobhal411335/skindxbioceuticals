import type { ProductId } from "@/types/product";

export type CartItemId = string;

export type CartItem = {
  id: CartItemId;
  productId: ProductId;
  variantId?: string;
  quantity: number;
  unitPriceInPaise: number;
};

export type CartTotals = {
  subtotalInPaise: number;
  discountInPaise: number;
  shippingInPaise: number;
  taxInPaise: number;
  totalInPaise: number;
};

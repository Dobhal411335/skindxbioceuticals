import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { CartExtrasState, CartItem } from "@/types/cart";

export type CartStatus = "idle" | "loading" | "ready" | "error";

export type CartState = {
  items: CartItem[];
  status: CartStatus;
  extras: CartExtrasState;
};

const FREE_SHIPPING_THRESHOLD_PAISE = 99900;
const GIFT_WRAP_PAISE = 100000;
const DEMO_COUPON = "DISCOUNT10";
const DEMO_COUPON_RATE = 0.1;

const sampleItem: CartItem = {
  id: "cart-sample-1",
  productId: "p1",
  variantId: "p1-default",
  slug: "daily-barrier-serum",
  name: "Daily Barrier Serum",
  image:
    "https://images.unsplash.com/photo-1620916297397-a4a33220b72c?auto=format&fit=crop&w=400&q=80",
  alt: "Dropper bottle of facial serum",
  variantLabel: "30 ml",
  quantity: 2,
  unitPriceInPaise: 149900,
};

const initialState: CartState = {
  items: [sampleItem],
  status: "ready",
  extras: {
    notes: "",
    giftWrap: false,
    couponCode: "",
    appliedCoupon: DEMO_COUPON,
    termsAccepted: false,
  },
};

function cartLineId(productId: string, variantId?: string) {
  return `${productId}:${variantId ?? "default"}`;
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCartItems(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload;
      state.status = "ready";
    },
    addCartItem(
      state,
      action: PayloadAction<Omit<CartItem, "id" | "quantity"> & { quantity?: number }>,
    ) {
      const quantity = action.payload.quantity ?? 1;
      const id = cartLineId(action.payload.productId, action.payload.variantId);
      const existing = state.items.find((item) => item.id === id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({ ...action.payload, id, quantity });
      }
      state.status = "ready";
    },
    removeCartItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    updateCartItemQuantity(
      state,
      action: PayloadAction<{ id: string; quantity: number }>,
    ) {
      const item = state.items.find((entry) => entry.id === action.payload.id);
      if (!item) return;
      item.quantity = Math.max(1, action.payload.quantity);
    },
    clearCart(state) {
      state.items = [];
      state.status = "idle";
      state.extras.appliedCoupon = null;
      state.extras.couponCode = "";
      state.extras.giftWrap = false;
      state.extras.notes = "";
      state.extras.termsAccepted = false;
    },
    setCartStatus(state, action: PayloadAction<CartStatus>) {
      state.status = action.payload;
    },
    setCartNotes(state, action: PayloadAction<string>) {
      state.extras.notes = action.payload;
    },
    setGiftWrap(state, action: PayloadAction<boolean>) {
      state.extras.giftWrap = action.payload;
    },
    setCouponCode(state, action: PayloadAction<string>) {
      state.extras.couponCode = action.payload;
    },
    applyCoupon(state, action: PayloadAction<string | null>) {
      state.extras.appliedCoupon = action.payload;
      if (action.payload) {
        state.extras.couponCode = action.payload;
      }
    },
    setTermsAccepted(state, action: PayloadAction<boolean>) {
      state.extras.termsAccepted = action.payload;
    },
  },
});

export const {
  setCartItems,
  addCartItem,
  removeCartItem,
  updateCartItemQuantity,
  clearCart,
  setCartStatus,
  setCartNotes,
  setGiftWrap,
  setCouponCode,
  applyCoupon,
  setTermsAccepted,
} = cartSlice.actions;

export default cartSlice.reducer;

export function selectCartSubtotal(items: CartItem[]) {
  return items.reduce(
    (sum, item) => sum + item.unitPriceInPaise * item.quantity,
    0,
  );
}

export function selectCartDiscount(subtotalInPaise: number, coupon: string | null) {
  if (coupon?.toUpperCase() === DEMO_COUPON) {
    return Math.round(subtotalInPaise * DEMO_COUPON_RATE);
  }
  return 0;
}

export function selectCartGiftWrap(enabled: boolean) {
  return enabled ? GIFT_WRAP_PAISE : 0;
}

export function selectAmountToFreeShipping(subtotalInPaise: number) {
  return Math.max(0, FREE_SHIPPING_THRESHOLD_PAISE - subtotalInPaise);
}

export {
  FREE_SHIPPING_THRESHOLD_PAISE,
  GIFT_WRAP_PAISE,
  DEMO_COUPON,
};

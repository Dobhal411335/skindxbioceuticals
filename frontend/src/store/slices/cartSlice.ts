import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { CartExtrasState, CartItem } from "@/types/cart";

export type CartStatus = "idle" | "loading" | "ready" | "error" | "syncing";

export type CartState = {
  items: CartItem[];
  status: CartStatus;
  hydrated: boolean;
  error: string | null;
  extras: CartExtrasState;
};

/** Kept for optional gift-wrap / demo coupon paths (UI currently commented out). */
const FREE_SHIPPING_THRESHOLD_PAISE = 99900;
const GIFT_WRAP_PAISE = 100000;
const DEMO_COUPON = "DISCOUNT10";
const DEMO_COUPON_RATE = 0.1;

const initialState: CartState = {
  items: [],
  status: "idle",
  hydrated: false,
  error: null,
  extras: {
    notes: "",
    giftWrap: false,
    couponCode: "",
    appliedCoupon: null,
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
      state.hydrated = true;
      state.error = null;
    },
    upsertCartItem(state, action: PayloadAction<CartItem>) {
      const byId = state.items.findIndex((item) => item.id === action.payload.id);
      const byVariant = state.items.findIndex(
        (item) =>
          item.productId === action.payload.productId &&
          item.variantId === action.payload.variantId,
      );
      const index = byId >= 0 ? byId : byVariant;
      if (index >= 0) {
        state.items[index] = {
          ...action.payload,
          note: action.payload.note ?? state.items[index].note,
        };
      } else {
        state.items.unshift(action.payload);
      }
      state.status = "ready";
      state.hydrated = true;
      state.error = null;
    },
    addCartItem(
      state,
      action: PayloadAction<
        Omit<CartItem, "id" | "quantity"> & { id?: string; quantity?: number }
      >,
    ) {
      const quantity = action.payload.quantity ?? 1;
      const id =
        action.payload.id ??
        cartLineId(action.payload.productId, action.payload.variantId);
      const existing = state.items.find(
        (item) =>
          item.id === id ||
          (item.productId === action.payload.productId &&
            item.variantId === action.payload.variantId),
      );
      if (existing) {
        existing.id = id;
        existing.quantity += quantity;
        existing.unitPriceInPaise = action.payload.unitPriceInPaise;
        existing.originalUnitPriceInPaise =
          action.payload.originalUnitPriceInPaise;
        existing.discountCode = action.payload.discountCode;
        existing.discountInPaise = action.payload.discountInPaise;
        existing.variantLabel = action.payload.variantLabel;
        existing.image = action.payload.image;
        existing.alt = action.payload.alt;
        existing.name = action.payload.name;
        existing.slug = action.payload.slug;
        if (action.payload.note !== undefined) {
          existing.note = action.payload.note;
        }
      } else {
        state.items.push({ ...action.payload, id, quantity });
      }
      state.status = "ready";
      state.hydrated = true;
    },
    setCartItemNote(
      state,
      action: PayloadAction<{ id: string; note: string }>,
    ) {
      const item = state.items.find((entry) => entry.id === action.payload.id);
      if (!item) return;
      item.note = action.payload.note.trim() || undefined;
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
      state.hydrated = false;
      state.error = null;
      state.extras.appliedCoupon = null;
      state.extras.couponCode = "";
      state.extras.giftWrap = false;
      state.extras.notes = "";
      state.extras.termsAccepted = false;
    },
    setCartStatus(state, action: PayloadAction<CartStatus>) {
      state.status = action.payload;
    },
    setCartError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      if (action.payload) {
        state.status = "error";
      }
    },
    setCartHydrated(state, action: PayloadAction<boolean>) {
      state.hydrated = action.payload;
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
  upsertCartItem,
  addCartItem,
  removeCartItem,
  updateCartItemQuantity,
  clearCart,
  setCartStatus,
  setCartError,
  setCartHydrated,
  setCartNotes,
  setCartItemNote,
  setGiftWrap,
  setCouponCode,
  applyCoupon,
  setTermsAccepted,
} = cartSlice.actions;

export { cartLineId };

export default cartSlice.reducer;

/** Payable subtotal (after product discounts). */
export function selectCartSubtotal(items: CartItem[]) {
  return items.reduce(
    (sum, item) => sum + item.unitPriceInPaise * item.quantity,
    0,
  );
}

/** Original / list-price subtotal before product discounts. */
export function selectCartOriginalSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => {
    const original =
      item.originalUnitPriceInPaise != null &&
      item.originalUnitPriceInPaise > item.unitPriceInPaise
        ? item.originalUnitPriceInPaise
        : item.unitPriceInPaise;
    return sum + original * item.quantity;
  }, 0);
}

/** Product-level discount savings (original − payable). */
export function selectCartProductDiscount(items: CartItem[]) {
  return Math.max(0, selectCartOriginalSubtotal(items) - selectCartSubtotal(items));
}

export function selectCartDiscountPercent(items: CartItem[]) {
  const original = selectCartOriginalSubtotal(items);
  if (original <= 0) return 0;
  const discount = selectCartProductDiscount(items);
  if (discount <= 0) return 0;
  return Math.round((discount / original) * 100);
}

/** @deprecated Cart-level demo coupon — kept for commented-out coupon UI. */
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

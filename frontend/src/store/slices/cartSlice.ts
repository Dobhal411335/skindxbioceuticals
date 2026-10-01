import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { CartItem } from "@/types/cart";

export type CartStatus = "idle" | "loading" | "ready" | "error";

export type CartState = {
  items: CartItem[];
  status: CartStatus;
};

const initialState: CartState = {
  items: [],
  status: "idle",
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCartItems(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload;
      state.status = "ready";
    },
    clearCart(state) {
      state.items = [];
      state.status = "idle";
    },
    setCartStatus(state, action: PayloadAction<CartStatus>) {
      state.status = action.payload;
    },
  },
});

export const { setCartItems, clearCart, setCartStatus } = cartSlice.actions;
export default cartSlice.reducer;

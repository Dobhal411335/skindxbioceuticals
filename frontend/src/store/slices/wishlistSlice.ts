import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { WishlistItem } from "@/features/wishlist/wishlist.types";

export type WishlistStatus = "idle" | "loading" | "ready" | "error" | "syncing";

export type WishlistState = {
  items: WishlistItem[];
  status: WishlistStatus;
  hydrated: boolean;
  error: string | null;
};

const initialState: WishlistState = {
  items: [],
  status: "idle",
  hydrated: false,
  error: null,
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    setWishlistItems(state, action: PayloadAction<WishlistItem[]>) {
      state.items = action.payload;
      state.status = "ready";
      state.hydrated = true;
      state.error = null;
    },
    upsertWishlistItem(state, action: PayloadAction<WishlistItem>) {
      const index = state.items.findIndex(
        (item) => item.productId === action.payload.productId,
      );
      if (index >= 0) {
        state.items[index] = action.payload;
      } else {
        state.items.unshift(action.payload);
      }
      state.status = "ready";
      state.hydrated = true;
      state.error = null;
    },
    removeWishlistItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
      state.status = "ready";
    },
    clearWishlist(state) {
      state.items = [];
      state.status = "idle";
      state.hydrated = false;
      state.error = null;
    },
    setWishlistStatus(state, action: PayloadAction<WishlistStatus>) {
      state.status = action.payload;
    },
    setWishlistError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      if (action.payload) {
        state.status = "error";
      }
    },
    setWishlistHydrated(state, action: PayloadAction<boolean>) {
      state.hydrated = action.payload;
    },
  },
});

export const {
  setWishlistItems,
  upsertWishlistItem,
  removeWishlistItem,
  clearWishlist,
  setWishlistStatus,
  setWishlistError,
  setWishlistHydrated,
} = wishlistSlice.actions;

export const selectWishlistItems = (state: { wishlist: WishlistState }) =>
  state.wishlist.items;
export const selectWishlistCount = (state: { wishlist: WishlistState }) =>
  state.wishlist.items.length;
export const selectWishlistProductIds = (state: { wishlist: WishlistState }) =>
  state.wishlist.items.map((item) => item.productId);
export const selectIsProductInWishlist =
  (productId: string) => (state: { wishlist: WishlistState }) =>
    state.wishlist.items.some((item) => item.productId === productId);

export default wishlistSlice.reducer;

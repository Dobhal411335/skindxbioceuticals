import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type WishlistStatus = "idle" | "loading" | "ready" | "error";

export type WishlistState = {
  itemIds: string[];
  status: WishlistStatus;
};

const initialState: WishlistState = {
  itemIds: [],
  status: "idle",
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    setWishlistItemIds(state, action: PayloadAction<string[]>) {
      state.itemIds = action.payload;
      state.status = "ready";
    },
    clearWishlist(state) {
      state.itemIds = [];
      state.status = "idle";
    },
    setWishlistStatus(state, action: PayloadAction<WishlistStatus>) {
      state.status = action.payload;
    },
  },
});

export const { setWishlistItemIds, clearWishlist, setWishlistStatus } = wishlistSlice.actions;
export default wishlistSlice.reducer;

import { configureStore } from "@reduxjs/toolkit";

import authReducer from "@/store/slices/authSlice";
import cartReducer from "@/store/slices/cartSlice";
import userReducer from "@/store/slices/userSlice";
import wishlistReducer from "@/store/slices/wishlistSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      cart: cartReducer,
      wishlist: wishlistReducer,
      user: userReducer,
    },
    devTools: process.env.NODE_ENV !== "production",
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

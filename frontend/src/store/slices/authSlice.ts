import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { tokenStore } from "@/services/api/token-store";
import type { AuthUser } from "@/types/auth";

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

export type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  status: AuthStatus;
};

const initialState: AuthState = {
  user: null,
  accessToken: null,
  status: "idle",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ user: AuthUser; accessToken: string }>,
    ) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.status = "authenticated";
      tokenStore.setAccessToken(action.payload.accessToken);
    },
    clearCredentials(state) {
      state.user = null;
      state.accessToken = null;
      state.status = "unauthenticated";
      tokenStore.clear();
    },
    setAuthStatus(state, action: PayloadAction<AuthStatus>) {
      state.status = action.payload;
    },
  },
});

export const { setCredentials, clearCredentials, setAuthStatus } = authSlice.actions;
export default authSlice.reducer;

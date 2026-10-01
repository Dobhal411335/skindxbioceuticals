import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { UserProfile } from "@/types/user";

export type UserStatus = "idle" | "loading" | "ready" | "error";

export type UserState = {
  profile: UserProfile | null;
  status: UserStatus;
};

const initialState: UserState = {
  profile: null,
  status: "idle",
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserProfile(state, action: PayloadAction<UserProfile | null>) {
      state.profile = action.payload;
      state.status = action.payload ? "ready" : "idle";
    },
    clearUserProfile(state) {
      state.profile = null;
      state.status = "idle";
    },
    setUserStatus(state, action: PayloadAction<UserStatus>) {
      state.status = action.payload;
    },
  },
});

export const { setUserProfile, clearUserProfile, setUserStatus } = userSlice.actions;
export default userSlice.reducer;

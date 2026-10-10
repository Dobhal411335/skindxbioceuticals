"use client";

import { useAppSelector } from "@/hooks/useAppSelector";

/**
 * Thin selector over the Redux auth slice — not a separate auth provider.
 */
export function useAuth() {
  const { user, accessToken, status } = useAppSelector((state) => state.auth);

  return {
    user,
    accessToken,
    status,
    isLoading: status === "idle" || status === "loading",
    isAuthenticated: status === "authenticated" && Boolean(user),
    isUnauthenticated: status === "unauthenticated",
  };
}

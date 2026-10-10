"use client";

import { useEffect } from "react";

import { authService } from "@/features/auth/auth.service";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { tokenStore } from "@/services/api/token-store";
import {
  clearCredentials,
  setAuthStatus,
  setCredentials,
} from "@/store/slices/authSlice";

/**
 * Restores a storefront session after full page reload using the HttpOnly refresh cookie.
 * Does not treat Redux state alone as proof of authentication.
 */
export function AuthBootstrap() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.auth.status);

  useEffect(() => {
    if (status !== "idle") {
      return;
    }

    let cancelled = false;

    const bootstrap = async () => {
      dispatch(setAuthStatus("loading"));

      const existing = tokenStore.getAccessToken();
      if (existing) {
        try {
          const { user } = await authService.me();
          if (!cancelled) {
            dispatch(setCredentials({ user, accessToken: existing }));
          }
          return;
        } catch {
          // Fall through to cookie refresh
        }
      }

      const refreshed = await authService.refreshSession();
      if (cancelled) {
        return;
      }

      if (refreshed) {
        dispatch(
          setCredentials({
            user: refreshed.user,
            accessToken: refreshed.accessToken,
          }),
        );
        return;
      }

      dispatch(clearCredentials());
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [dispatch, status]);

  return null;
}

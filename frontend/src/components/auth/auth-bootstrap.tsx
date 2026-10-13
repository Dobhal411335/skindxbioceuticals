"use client";

import { useEffect } from "react";

import { authService } from "@/features/auth/auth.service";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { tokenStore } from "@/services/api/token-store";
import {
  clearCredentials,
  setAuthStatus,
  setCredentials,
} from "@/store/slices/authSlice";

/**
 * Restores a storefront session after full page reload using the HttpOnly refresh cookie.
 * Does not treat Redux state alone as proof of authentication.
 *
 * Runs once per mount. Do not depend on auth `status` here — dispatching `"loading"`
 * would re-run the effect, cancel the in-flight bootstrap, and leave the navbar
 * stuck on the account skeleton forever.
 */
export function AuthBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
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
  }, [dispatch]);

  return null;
}

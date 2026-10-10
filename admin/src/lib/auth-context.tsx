"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { adminLogin, fetchMe, logout as apiLogout } from "@/services/api/auth";
import { ApiError } from "@/services/api/errors";
import { tokenStore } from "@/services/api/token-store";
import type { AuthSite, AuthUser } from "@/types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  sites: AuthSite[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasSiteAccess: (code: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sites, setSites] = useState<AuthSite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const me = await fetchMe();
    setUser(me.user);
    setSites(me.sites);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const refreshToken = tokenStore.getRefreshToken();
      if (!refreshToken) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        // Access token may be missing after reload — refresh via interceptor on /me 401,
        // but seed a refresh attempt first by calling me; axios interceptor handles 401.
        // If no access token, force refresh endpoint through a lightweight me call after
        // manually refreshing once.
        const { default: axios } = await import("axios");
        const { env } = await import("@/config/env");
        const { endpoints } = await import("@/services/api/endpoints");

        if (!tokenStore.getAccessToken()) {
          const refreshed = await axios.post(`${env.apiUrl}${endpoints.auth.refresh}`, {
            refreshToken,
          });
          tokenStore.setAccessToken(refreshed.data.data.accessToken);
          tokenStore.setRefreshToken(refreshed.data.data.refreshToken);
        }

        const me = await fetchMe();
        if (!cancelled) {
          setUser(me.user);
          setSites(me.sites);
        }
      } catch {
        tokenStore.clear();
        if (!cancelled) {
          setUser(null);
          setSites([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await adminLogin(email, password);
    tokenStore.setAccessToken(result.accessToken);
    tokenStore.setRefreshToken(result.refreshToken);
    setUser(result.user);

    try {
      const me = await fetchMe();
      setSites(me.sites);
    } catch (error) {
      if (error instanceof ApiError) {
        setSites([]);
      }
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenStore.getRefreshToken();
    try {
      await apiLogout(refreshToken);
    } catch {
      // Always clear local session
    } finally {
      tokenStore.clear();
      setUser(null);
      setSites([]);
    }
  }, []);

  const hasSiteAccess = useCallback(
    (code: string) => sites.some((site) => site.code === code.toUpperCase()),
    [sites],
  );

  const value = useMemo(
    () => ({
      user,
      sites,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refreshProfile,
      hasSiteAccess,
    }),
    [user, sites, isLoading, login, logout, refreshProfile, hasSiteAccess],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

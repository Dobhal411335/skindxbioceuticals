const REFRESH_KEY = "skindx_admin_refresh_token";

let accessToken: string | null = null;

export const tokenStore = {
  getAccessToken(): string | null {
    return accessToken;
  },
  setAccessToken(token: string | null): void {
    accessToken = token;
  },
  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(REFRESH_KEY);
  },
  setRefreshToken(token: string | null): void {
    if (typeof window === "undefined") return;
    if (!token) {
      sessionStorage.removeItem(REFRESH_KEY);
      return;
    }
    sessionStorage.setItem(REFRESH_KEY, token);
  },
  clear(): void {
    accessToken = null;
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(REFRESH_KEY);
    }
  },
};

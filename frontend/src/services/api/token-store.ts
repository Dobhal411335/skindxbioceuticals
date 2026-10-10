/**
 * In-memory access-token store for the Axios client.
 * Refresh credentials use an HttpOnly cookie — never store them here or in localStorage.
 */
let accessToken: string | null = null;

export const tokenStore = {
  getAccessToken(): string | null {
    return accessToken;
  },
  setAccessToken(token: string | null): void {
    accessToken = token;
  },
  clear(): void {
    accessToken = null;
  },
};

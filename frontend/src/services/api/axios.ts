import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

import { env } from "@/config/env";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import {
  attachRequestMetadata,
  logAxiosFailure,
  logAxiosSuccess,
  type LoggedAxiosConfig,
} from "@/services/api/axios-logging";
import { toApiError } from "@/services/api/errors";
import { tokenStore } from "@/services/api/token-store";

/**
 * Single shared Axios instance for the storefront.
 * Do not create additional instances unless there is a clear, documented reason.
 */
export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 30_000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const next = attachRequestMetadata(config);
    const token = tokenStore.getAccessToken();
    if (token) {
      next.headers.Authorization = `Bearer ${token}`;
    }
    return next;
  },
  (error: AxiosError): Promise<never> => {
    logAxiosFailure(error);
    return Promise.reject(toApiError(error));
  },
);

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // Refresh token is an HttpOnly cookie — send credentials, no body token.
  // Use raw axios (not apiClient) to avoid interceptor loops; skip noisy logs.
  const response = await axios.post(
    `${env.apiUrl}${API_ENDPOINTS.AUTH.REFRESH}`,
    {},
    {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
      // Custom flag consumed only if this ever goes through our helpers.
      _skipHttpLog: true,
    } as LoggedAxiosConfig,
  );

  const nextToken = response.data?.data?.accessToken as string | undefined;
  if (!nextToken) {
    return null;
  }

  tokenStore.setAccessToken(nextToken);
  return nextToken;
}

apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => logAxiosSuccess(response),
  async (error: AxiosError): Promise<unknown> => {
    const original = error.config as LoggedAxiosConfig | undefined;
    const url = original?.url ?? "";

    const isAuthEndpoint =
      url.includes(API_ENDPOINTS.AUTH.GOOGLE) ||
      url.includes(API_ENDPOINTS.AUTH.LOGIN) ||
      url.includes(API_ENDPOINTS.AUTH.REGISTER) ||
      url.includes(API_ENDPOINTS.AUTH.VERIFY_EMAIL) ||
      url.includes(API_ENDPOINTS.AUTH.RESEND_VERIFICATION) ||
      url.includes(API_ENDPOINTS.AUTH.REFRESH) ||
      url.includes(API_ENDPOINTS.AUTH.LOGOUT);

    if (error.response?.status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      original._refreshPending = true;

      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const nextToken = await refreshPromise;
        if (nextToken) {
          original.headers.Authorization = `Bearer ${nextToken}`;
          original._refreshPending = false;
          return apiClient(original);
        }
      } catch {
        tokenStore.clear();
      }

      original._refreshPending = false;
    }

    logAxiosFailure(error);
    return Promise.reject(toApiError(error));
  },
);

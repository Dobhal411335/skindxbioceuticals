import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

import { env } from "@/config/env";
import {
  attachRequestMetadata,
  logAxiosFailure,
  logAxiosSuccess,
  type LoggedAxiosConfig,
} from "@/services/api/axios-logging";
import { toApiError } from "@/services/api/errors";
import { endpoints } from "@/services/api/endpoints";
import { tokenStore } from "@/services/api/token-store";

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
    return Promise.reject(
      toApiError(error as AxiosError<{ message?: string; errors?: unknown }>),
    );
  },
);

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  // Raw axios — do not log refresh token body.
  const response = await axios.post(
    `${env.apiUrl}${endpoints.auth.refresh}`,
    { refreshToken },
    { headers: { "Content-Type": "application/json" } },
  );

  const data = response.data?.data;
  if (!data?.accessToken || !data?.refreshToken) {
    return null;
  }

  tokenStore.setAccessToken(data.accessToken);
  tokenStore.setRefreshToken(data.refreshToken);
  return data.accessToken as string;
}

apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => logAxiosSuccess(response),
  async (error: AxiosError): Promise<unknown> => {
    const original = error.config as LoggedAxiosConfig | undefined;

    if (error.response?.status === 401 && original && !original._retry) {
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
    return Promise.reject(toApiError(error as AxiosError<{ message?: string }>));
  },
);

import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

import { env } from "@/config/env";
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
    const token = tokenStore.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError): Promise<never> =>
    Promise.reject(toApiError(error as AxiosError<{ message?: string; errors?: unknown }>)),
);

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) {
    return null;
  }

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
  (response: AxiosResponse): AxiosResponse => response,
  async (error: AxiosError): Promise<unknown> => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;

      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const nextToken = await refreshPromise;
        if (nextToken) {
          original.headers.Authorization = `Bearer ${nextToken}`;
          return apiClient(original);
        }
      } catch {
        tokenStore.clear();
      }
    }

    return Promise.reject(toApiError(error as AxiosError<{ message?: string }>));
  },
);

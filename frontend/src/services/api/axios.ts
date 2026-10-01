import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

import { env } from "@/config/env";
import { toApiError } from "@/services/api/errors";

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
    // Placeholder: attach Authorization header from auth state/storage when auth is implemented.
    return config;
  },
  (error: AxiosError): Promise<never> => {
    return Promise.reject(toApiError(error));
  },
);

apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: AxiosError): Promise<never> => {
    // Placeholder: handle 401 refresh/redirect and normalize API errors when auth is implemented.
    return Promise.reject(toApiError(error));
  },
);

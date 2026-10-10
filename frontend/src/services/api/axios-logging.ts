import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { isAxiosError } from "axios";
import { logger, sanitizeUrl } from "@/lib/logger";

export const REQUEST_ID_HEADER = "X-Request-Id";

export type LoggedAxiosConfig = InternalAxiosRequestConfig & {
  metadata?: {
    startTime: number;
    requestId: string;
  };
  /** Set when a 401 refresh retry is in progress — avoid duplicate failure logs. */
  _retry?: boolean;
  /** Skip HTTP logging (e.g. quiet refresh probe). */
  _skipHttpLog?: boolean;
  /** Failure already deferred because a refresh retry will follow. */
  _refreshPending?: boolean;
};

export function createRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `fe_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function attachRequestMetadata(
  config: InternalAxiosRequestConfig,
): LoggedAxiosConfig {
  const logged = config as LoggedAxiosConfig;
  const existingHeader =
    typeof logged.headers?.get === "function"
      ? logged.headers.get(REQUEST_ID_HEADER)
      : undefined;
  const existing =
    typeof existingHeader === "string" && existingHeader.length >= 8
      ? existingHeader
      : undefined;
  const requestId = existing ?? createRequestId();

  if (typeof logged.headers?.set === "function") {
    logged.headers.set(REQUEST_ID_HEADER, requestId);
  } else {
    logged.headers = {
      ...(logged.headers as unknown as Record<string, string>),
      [REQUEST_ID_HEADER]: requestId,
    } as unknown as InternalAxiosRequestConfig["headers"];
  }

  logged.metadata = {
    startTime: Date.now(),
    requestId,
  };
  return logged;
}

function routeFromConfig(config?: InternalAxiosRequestConfig): string {
  const raw = `${config?.baseURL ?? ""}${config?.url ?? ""}`;
  return sanitizeUrl(raw || "/");
}

function durationMs(config?: LoggedAxiosConfig): number | undefined {
  if (!config?.metadata?.startTime) {
    return undefined;
  }
  return Date.now() - config.metadata.startTime;
}

function responseRequestId(
  response?: AxiosResponse,
  config?: LoggedAxiosConfig,
): string | undefined {
  const header =
    response?.headers?.["x-request-id"] ?? response?.headers?.["X-Request-Id"];
  if (typeof header === "string" && header.length > 0) {
    return header;
  }
  return config?.metadata?.requestId;
}

export function logAxiosSuccess(response: AxiosResponse): AxiosResponse {
  const config = response.config as LoggedAxiosConfig;
  if (config._skipHttpLog) {
    return response;
  }

  logger.debug("API request succeeded", {
    event: "http.client.success",
    method: (config.method ?? "get").toUpperCase(),
    path: routeFromConfig(config),
    statusCode: response.status,
    durationMs: durationMs(config),
    requestId: responseRequestId(response, config),
  });
  return response;
}

export function isCanceledError(error: unknown): boolean {
  if (!isAxiosError(error)) {
    return false;
  }
  return (
    error.code === "ERR_CANCELED" ||
    error.name === "CanceledError" ||
    // Axios legacy
    (error as AxiosError & { __CANCEL__?: boolean }).__CANCEL__ === true
  );
}

export function logAxiosFailure(error: unknown, options?: { quiet?: boolean }): void {
  if (options?.quiet) {
    return;
  }

  if (isCanceledError(error)) {
    const axiosError = error as AxiosError;
    const config = axiosError.config as LoggedAxiosConfig | undefined;
    logger.debug("API request cancelled", {
      event: "http.client.cancelled",
      method: (config?.method ?? "get").toUpperCase(),
      path: routeFromConfig(config),
      requestId: config?.metadata?.requestId,
    });
    return;
  }

  if (!isAxiosError(error)) {
    logger.error("API request failed", {
      event: "http.client.failure",
      reason: "UNKNOWN",
    });
    return;
  }

  const config = error.config as LoggedAxiosConfig | undefined;
  if (config?._skipHttpLog || config?._refreshPending) {
    return;
  }

  const status = error.response?.status;
  const context = {
    event: "http.client.failure",
    method: (config?.method ?? "get").toUpperCase(),
    path: routeFromConfig(config),
    statusCode: status,
    durationMs: durationMs(config),
    requestId: responseRequestId(error.response, config),
    reason: status ? `HTTP_${status}` : (error.code ?? "NETWORK_ERROR"),
  };

  if (!status || status >= 500) {
    logger.error("API request failed", context);
    return;
  }
  logger.warn("API request failed", context);
}

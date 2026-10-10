import type { AxiosError } from "axios";

export class ApiError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function toApiError(error: AxiosError | AxiosError<{ message?: string; errors?: unknown }>): ApiError {
  const data = error.response?.data as { message?: string; errors?: unknown } | undefined;
  const message =
    data?.message ??
    error.message ??
    "Something went wrong. Please try again.";

  return new ApiError(message, error.response?.status, data?.errors);
}

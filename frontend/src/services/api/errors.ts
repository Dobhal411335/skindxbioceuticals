import type { ApiErrorBody } from "@/types/api";

export type ApiError = {
  message: string;
  statusCode: number | null;
  code: string | null;
  details: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiError(value: unknown): value is ApiError {
  return (
    isRecord(value) &&
    typeof value.message === "string" &&
    ("statusCode" in value || "code" in value || "details" in value) &&
    !("isAxiosError" in value)
  );
}

function readErrorBody(data: unknown): ApiErrorBody | null {
  if (!isRecord(data)) {
    return null;
  }

  const message = typeof data.message === "string" ? data.message : undefined;
  const code = typeof data.code === "string" ? data.code : undefined;
  const errors = data.errors;

  if (!message && !code && errors === undefined) {
    return null;
  }

  return {
    message,
    code,
    errors,
  };
}

export function toApiError(error: unknown): ApiError {
  // Axios interceptor already normalizes failures — don't wipe the message.
  if (isApiError(error)) {
    return error;
  }

  if (isRecord(error) && "isAxiosError" in error && error.isAxiosError === true) {
    const statusCode =
      isRecord(error.response) && typeof error.response.status === "number"
        ? error.response.status
        : null;

    const body = isRecord(error.response) ? readErrorBody(error.response.data) : null;

    const message =
      body?.message ??
      (typeof error.message === "string" ? error.message : "An unexpected API error occurred.");

    return {
      message,
      statusCode,
      code: body?.code ?? null,
      details: body?.errors ?? (isRecord(error.response) ? error.response.data : null),
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      statusCode: null,
      code: null,
      details: null,
    };
  }

  return {
    message: "An unexpected error occurred.",
    statusCode: null,
    code: null,
    details: error,
  };
}

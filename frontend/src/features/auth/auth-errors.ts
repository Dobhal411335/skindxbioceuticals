import { toApiError, type ApiError } from "@/services/api/errors";

/**
 * Maps auth API failures to user-facing copy.
 * Prefer the backend message when it is already safe and specific.
 */
export function getAuthErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  const apiError = toApiError(error);
  return resolveAuthMessage(apiError, fallback);
}

export function resolveAuthMessage(
  apiError: ApiError,
  fallback = "Something went wrong. Please try again.",
): string {
  const backendMessage = apiError.message?.trim();

  if (backendMessage && isUsefulBackendMessage(backendMessage)) {
    return backendMessage;
  }

  switch (apiError.statusCode) {
    case 409:
      return "An account with this email already exists. Sign in with your password, or use the method you registered with.";
    case 403:
      return "This account cannot sign in right now. Contact support if you need help.";
    case 401:
      return "Sign-in failed. Check your details and try again.";
    case 422:
      return "Some details look invalid. Please check the form and try again.";
    case 429:
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return fallback;
  }
}

function isUsefulBackendMessage(message: string): boolean {
  const generic = new Set([
    "conflict",
    "unauthorized",
    "forbidden",
    "too many requests",
    "request failed with status code 409",
    "request failed with status code 401",
    "request failed with status code 403",
    "request failed with status code 429",
    "an unexpected api error occurred.",
    "an unexpected error occurred.",
  ]);

  return !generic.has(message.toLowerCase());
}

import { randomUUID } from 'node:crypto';

export const REQUEST_ID_HEADER = 'x-request-id';
export const REQUEST_ID_RESPONSE_HEADER = 'X-Request-Id';

/** Max length for a client-supplied request/correlation ID. */
export const REQUEST_ID_MAX_LENGTH = 128;

/** Safe charset: alphanumeric, underscore, hyphen. Min 8 chars. */
const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

export function isValidRequestId(value: unknown): value is string {
  return typeof value === 'string' && REQUEST_ID_PATTERN.test(value);
}

/**
 * Accept a client-supplied ID only when it passes validation; otherwise generate one.
 * Never trust arbitrary client IDs without length and charset limits.
 */
export function resolveRequestId(incoming: unknown): string {
  if (isValidRequestId(incoming) && incoming.length <= REQUEST_ID_MAX_LENGTH) {
    return incoming;
  }
  return randomUUID();
}

export function extractIncomingRequestId(
  headerValue: string | string[] | undefined,
): string | undefined {
  if (typeof headerValue === 'string') {
    return headerValue.trim();
  }
  if (Array.isArray(headerValue) && typeof headerValue[0] === 'string') {
    return headerValue[0].trim();
  }
  return undefined;
}

const SENSITIVE_KEY_PATTERN =
  /^(password|confirmPassword|currentPassword|newPassword|otp|verificationCode|resetToken|accessToken|refreshToken|credential|authorization|cookie|set-cookie|apiKey|api_key|clientSecret|client_secret|token|bootstrapSecret|secret|jwt|cardNumber|cvv|cvc|pan)$/i;

const SENSITIVE_QUERY_KEYS = new Set([
  'password',
  'confirmpassword',
  'currentpassword',
  'newpassword',
  'otp',
  'verificationcode',
  'resettoken',
  'accesstoken',
  'refreshtoken',
  'token',
  'authorization',
  'apikey',
  'api_key',
  'clientsecret',
  'secret',
  'bootstrapsecret',
  'credential',
  'code',
]);

export const REDACTED = '[REDACTED]';

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERN.test(key);
}

/**
 * Deep-redact known sensitive keys. Prefer not logging arbitrary payloads at all;
 * this is a safety net when structured metadata must be included.
 */
export function redactValue(value: unknown, depth = 0): unknown {
  if (depth > 6) {
    return '[MaxDepth]';
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, depth + 1));
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      result[key] = isSensitiveKey(key) ? REDACTED : redactValue(nested, depth + 1);
    }
    return result;
  }

  return value;
}

/**
 * Strip or redact query parameters that may contain credentials.
 * Returns path + sanitized query, never a fully trusted raw URL.
 */
export function sanitizeUrl(rawUrl: string): string {
  if (!rawUrl) {
    return '';
  }

  try {
    const hasProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(rawUrl);
    const parsed = hasProtocol ? new URL(rawUrl) : new URL(rawUrl, 'http://localhost');

    const params = parsed.searchParams;
    let mutated = false;
    for (const key of [...params.keys()]) {
      if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
        params.set(key, REDACTED);
        mutated = true;
      }
    }

    const path = parsed.pathname || '/';
    const search = params.toString();
    if (!search) {
      return path;
    }
    return mutated || search ? `${path}?${search}` : path;
  } catch {
    // Fall back to stripping query entirely if parsing fails.
    const q = rawUrl.indexOf('?');
    return q === -1 ? rawUrl : rawUrl.slice(0, q);
  }
}

export function sanitizePath(pathOrUrl: string): string {
  return sanitizeUrl(pathOrUrl);
}

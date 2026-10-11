const SENSITIVE_KEY_PATTERN =
  /^(password|confirmPassword|currentPassword|newPassword|otp|verificationCode|resetToken|accessToken|refreshToken|credential|authorization|cookie|set-cookie|apiKey|api_key|clientSecret|client_secret|token|secret)$/i;

const SENSITIVE_QUERY_KEYS = new Set([
  "password",
  "otp",
  "token",
  "accesstoken",
  "refreshtoken",
  "authorization",
  "apikey",
  "secret",
  "code",
  "credential",
]);

export const REDACTED = "[REDACTED]";

/** Matches `token: …`, `password=…`, etc. inside free-form messages. */
const SENSITIVE_INLINE_PATTERN =
  /\b((?:password|passwd|pwd|otp|token|access[_-]?token|refresh[_-]?token|secret|api[_-]?key|authorization|credential)\s*[:=]\s*)([^\s,;]+)/gi;

const BEARER_PATTERN = /\b(Bearer\s+)([A-Za-z0-9._\-+=/]+)/gi;

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERN.test(key);
}

export function redactSensitiveText(text: string): string {
  if (!text) {
    return text;
  }
  return text
    .replace(SENSITIVE_INLINE_PATTERN, `$1${REDACTED}`)
    .replace(BEARER_PATTERN, `$1${REDACTED}`);
}

export function redactValue(value: unknown, depth = 0): unknown {
  if (depth > 6) {
    return "[MaxDepth]";
  }
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, depth + 1));
  }
  if (value instanceof Error) {
    return { name: value.name, message: redactSensitiveText(value.message) };
  }
  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      result[key] = isSensitiveKey(key) ? REDACTED : redactValue(nested, depth + 1);
    }
    return result;
  }
  if (typeof value === "string") {
    return redactSensitiveText(value);
  }
  return value;
}

export function sanitizeUrl(rawUrl: string): string {
  if (!rawUrl) {
    return "";
  }
  try {
    const hasProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(rawUrl);
    const parsed = hasProtocol ? new URL(rawUrl) : new URL(rawUrl, "http://localhost");
    const params = parsed.searchParams;
    for (const key of [...params.keys()]) {
      if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
        params.set(key, REDACTED);
      }
    }
    const path = parsed.pathname || "/";
    const search = params.toString();
    return search ? `${path}?${search}` : path;
  } catch {
    const q = rawUrl.indexOf("?");
    return q === -1 ? rawUrl : rawUrl.slice(0, q);
  }
}

import type { CookieOptions, Response } from 'express';
import { env } from '@/config/env';
import { expiresAtFromDuration } from '@/lib/tokenExpiry';

/**
 * HttpOnly refresh-token cookie helpers for storefront/customer sessions.
 * Access tokens remain in the JSON response (Bearer Authorization).
 */
export function getRefreshCookieName(): string {
  return env.AUTH_REFRESH_COOKIE_NAME;
}

export function refreshCookieOptions(): CookieOptions {
  const secure =
    env.AUTH_COOKIE_SECURE !== undefined ? env.AUTH_COOKIE_SECURE : env.NODE_ENV === 'production';

  const sameSite = env.AUTH_COOKIE_SAME_SITE;
  const expires = expiresAtFromDuration(env.JWT_REFRESH_EXPIRES_IN);

  return {
    httpOnly: true,
    secure: sameSite === 'none' ? true : secure,
    sameSite,
    path: '/',
    expires,
  };
}

export function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  res.cookie(getRefreshCookieName(), refreshToken, refreshCookieOptions());
}

export function clearRefreshTokenCookie(res: Response): void {
  const { expires: _expires, maxAge: _maxAge, ...options } = refreshCookieOptions();
  res.clearCookie(getRefreshCookieName(), options);
}

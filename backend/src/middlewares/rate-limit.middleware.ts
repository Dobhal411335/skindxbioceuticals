import type { NextFunction, Request, Response } from 'express';
import { sendError } from '@/utils/apiResponse';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix: string;
}

/**
 * Lightweight in-memory rate limiter for auth endpoints.
 * Suitable for a single Node process; replace with a shared store for multi-instance production.
 */
export function createRateLimiter(options: RateLimitOptions) {
  const buckets = new Map<string, RateLimitBucket>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const identity = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${options.keyPrefix}:${identity}`;
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    if (existing.count >= options.max) {
      const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      sendError(res, 'Too many requests. Please try again later.', 429);
      return;
    }

    existing.count += 1;
    next();
  };
}

export const registerRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyPrefix: 'auth-register',
});

export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyPrefix: 'auth-login',
});

export const verifyEmailRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyPrefix: 'auth-verify',
});

export const resendVerificationRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: 'auth-resend',
});

export const refreshRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  keyPrefix: 'auth-refresh',
});

export const changePasswordRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: 'auth-change-password',
});

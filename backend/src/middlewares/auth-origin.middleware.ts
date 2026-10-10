import type { NextFunction, Request, Response } from 'express';
import { env } from '@/config/env';
import { ForbiddenError } from '@/utils/AppError';

/**
 * Lightweight CSRF mitigation for cookie-driven auth mutations.
 * Allows requests whose Origin (or Referer origin) is in CORS_ORIGINS,
 * or requests with no Origin/Referer (e.g. same-origin non-browser / admin JSON body refresh).
 */
export function requireAllowedAuthOrigin(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const originHeader = req.get('origin');
  const refererHeader = req.get('referer');

  let requestOrigin: string | undefined;
  if (originHeader) {
    requestOrigin = originHeader;
  } else if (refererHeader) {
    try {
      requestOrigin = new URL(refererHeader).origin;
    } catch {
      throw new ForbiddenError('Invalid request origin');
    }
  }

  if (!requestOrigin) {
    next();
    return;
  }

  if (!env.CORS_ORIGINS.includes(requestOrigin)) {
    throw new ForbiddenError('Request origin is not allowed');
  }

  next();
}

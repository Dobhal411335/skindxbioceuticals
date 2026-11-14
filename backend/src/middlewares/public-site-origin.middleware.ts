import type { NextFunction, Request, Response } from 'express';
import { env } from '@/config/env';
import { isSameSitePublicOrigin } from '../lib/public-origin';
import { ForbiddenError } from '@/utils/AppError';

export const SITE_FETCH_SECRET_HEADER = 'x-site-fetch-secret';

export type PublicSiteCode = 'IN' | 'COM';

export function normalizePublicSiteCode(value: unknown): PublicSiteCode | null {
  if (typeof value !== 'string') return null;
  const code = value.trim().toUpperCase();
  if (code === 'IN' || code === 'COM') return code;
  return null;
}

function originOf(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isLocalHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

export function assertPublicSiteAccess(input: {
  siteCode: PublicSiteCode | null;
  originHeader?: string;
  refererHeader?: string;
  fetchSecret?: string;
  nodeEnv: string;
  siteInUrl: string;
  siteComUrl: string;
  expectedSecret: string;
}): void {
  if (!input.siteCode) {
    throw new ForbiddenError('Invalid site code');
  }

  const allowedSiteOrigin = originOf(input.siteCode === 'COM' ? input.siteComUrl : input.siteInUrl);
  const requestOrigin = originOf(input.originHeader) ?? originOf(input.refererHeader);

  if (input.originHeader && !originOf(input.originHeader)) {
    throw new ForbiddenError('Request origin is not allowed for this site');
  }

  if (requestOrigin) {
    // SITE_IN_URL / SITE_COM_URL are canonical; also allow their www ↔ apex twin.
    if (allowedSiteOrigin && isSameSitePublicOrigin(requestOrigin, allowedSiteOrigin)) {
      return;
    }
    if (input.nodeEnv === 'development') {
      try {
        if (isLocalHostname(new URL(requestOrigin).hostname)) return;
      } catch {
        throw new ForbiddenError('Request origin is not allowed for this site');
      }
    }
    throw new ForbiddenError('Request origin is not allowed for this site');
  }

  const provided = input.fetchSecret?.trim() ?? '';
  if (provided && input.expectedSecret && provided === input.expectedSecret) return;
  throw new ForbiddenError('Request origin is not allowed for this site');
}

function querySiteCode(req: Request): string | undefined {
  const query = req.query.siteCode;
  const value = Array.isArray(query) ? query[0] : query;
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function enforce(req: Request, siteCode: PublicSiteCode): void {
  assertPublicSiteAccess({
    siteCode,
    originHeader: req.get('origin') || undefined,
    refererHeader: req.get('referer') || undefined,
    fetchSecret: req.get(SITE_FETCH_SECRET_HEADER) || undefined,
    nodeEnv: env.NODE_ENV,
    siteInUrl: env.SITE_IN_URL,
    siteComUrl: env.SITE_COM_URL,
    expectedSecret: env.SITE_FETCH_SECRET,
  });
}

/** Public /sites/:siteCode and prescription uploads must match the site origin or the server fetch secret. */
export function requirePublicSiteAccess(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const param = req.params.siteCode;
    if (typeof param === 'string' && param.trim()) {
      const siteCode = normalizePublicSiteCode(param);
      if (!siteCode) {
        next();
        return;
      }
      enforce(req, siteCode);
      next();
      return;
    }

    if (req.originalUrl.includes('/checkout/prescription')) {
      const rawQuery = querySiteCode(req);
      if (rawQuery && !normalizePublicSiteCode(rawQuery)) {
        throw new ForbiddenError('Invalid site code');
      }
      enforce(req, normalizePublicSiteCode(rawQuery) ?? 'IN');
    }
    next();
  } catch (error) {
    next(error);
  }
}

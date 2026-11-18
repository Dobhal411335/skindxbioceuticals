import type { NextFunction, Request, Response } from 'express';
import { env } from '@/config/env';
import { prisma } from '@/lib/prisma';
import { isLocalHostname, isSameSitePublicOrigin } from '@/lib/public-origin';
import type { SiteCode } from '@/types/common';
import { ForbiddenError, ValidationError } from '@/utils/AppError';
import {
  normalizePublicSiteCode,
  SITE_FETCH_SECRET_HEADER,
  type PublicSiteCode,
} from './public-site-origin.middleware';

export const STOREFRONT_SITE_HEADER = 'x-storefront-site';

function originOf(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function siteCodeForConfiguredOrigin(
  requestOrigin: string,
  siteInUrl: string,
  siteComUrl: string,
): PublicSiteCode | null {
  const inOrigin = originOf(siteInUrl);
  const comOrigin = originOf(siteComUrl);
  if (inOrigin && isSameSitePublicOrigin(requestOrigin, inOrigin)) return 'IN';
  if (comOrigin && isSameSitePublicOrigin(requestOrigin, comOrigin)) return 'COM';
  return null;
}

/**
 * Resolve IN|COM for cart / wishlist / orders / payments / guest checkout.
 * Trust Origin↔SITE_*_URL mapping, or SITE_FETCH_SECRET + X-Storefront-Site for server fetches.
 * On local development hosts, X-Storefront-Site is required and is the site selector.
 */
export function resolveStorefrontSiteCode(input: {
  declaredSiteHeader?: string;
  originHeader?: string;
  refererHeader?: string;
  fetchSecret?: string;
  nodeEnv: string;
  siteInUrl: string;
  siteComUrl: string;
  expectedSecret: string;
}): PublicSiteCode {
  const declared = normalizePublicSiteCode(input.declaredSiteHeader);
  const requestOrigin = originOf(input.originHeader) ?? originOf(input.refererHeader);

  if (input.originHeader && !originOf(input.originHeader)) {
    throw new ForbiddenError('Request origin is not allowed for this site');
  }

  if (requestOrigin) {
    let isLocalDevHost = false;
    if (input.nodeEnv === 'development') {
      try {
        isLocalDevHost = isLocalHostname(new URL(requestOrigin).hostname);
      } catch {
        throw new ForbiddenError('Request origin is not allowed for this site');
      }
    }

    // Local ports often share SITE_IN_URL; trust X-Storefront-Site on localhost in development.
    if (isLocalDevHost) {
      if (!declared) {
        throw new ValidationError(
          `${STOREFRONT_SITE_HEADER} header is required on local storefront requests`,
        );
      }
      return declared;
    }

    const mapped = siteCodeForConfiguredOrigin(
      requestOrigin,
      input.siteInUrl,
      input.siteComUrl,
    );
    if (mapped) {
      if (declared && declared !== mapped) {
        throw new ForbiddenError('Storefront site does not match request origin');
      }
      return mapped;
    }

    throw new ForbiddenError('Request origin is not allowed for this site');
  }

  const provided = input.fetchSecret?.trim() ?? '';
  if (provided && input.expectedSecret && provided === input.expectedSecret) {
    if (!declared) {
      throw new ValidationError(
        `${STOREFRONT_SITE_HEADER} header is required for server storefront fetches`,
      );
    }
    return declared;
  }

  throw new ForbiddenError('Request origin is not allowed for this site');
}

/** Attach `req.site` for storefront commerce routes from Origin + X-Storefront-Site. */
export async function requireStorefrontSite(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const code = resolveStorefrontSiteCode({
      declaredSiteHeader: req.get(STOREFRONT_SITE_HEADER) || undefined,
      originHeader: req.get('origin') || undefined,
      refererHeader: req.get('referer') || undefined,
      fetchSecret: req.get(SITE_FETCH_SECRET_HEADER) || undefined,
      nodeEnv: env.NODE_ENV,
      siteInUrl: env.SITE_IN_URL,
      siteComUrl: env.SITE_COM_URL,
      expectedSecret: env.SITE_FETCH_SECRET,
    });

    const site = await prisma.site.findFirst({
      where: { code, isActive: true },
      select: { id: true, code: true, name: true },
    });
    if (!site || (site.code !== 'IN' && site.code !== 'COM')) {
      throw new ForbiddenError('Storefront site is not available');
    }

    req.site = {
      id: site.id,
      code: site.code as SiteCode,
      name: site.name,
    };
    next();
  } catch (error) {
    next(error);
  }
}

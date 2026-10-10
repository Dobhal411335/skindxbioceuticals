import type { NextFunction, Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import type { SiteCode } from '@/types/common';
import { ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from '@/utils/AppError';

const SITE_CODES = new Set<SiteCode>(['IN', 'COM']);

function normalizeSiteCode(value: unknown): SiteCode {
  if (typeof value !== 'string') {
    throw new ValidationError('Site code is required');
  }

  const code = value.trim().toUpperCase() as SiteCode;
  if (!SITE_CODES.has(code)) {
    throw new ValidationError('Invalid site code');
  }

  return code;
}

/**
 * Resolves `:siteCode` from params, verifies the authenticated admin may access it,
 * and attaches `req.site` for downstream handlers.
 */
export function requireSiteAccess(paramName = 'siteCode') {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const code = normalizeSiteCode(req.params[paramName]);

      const site = await prisma.site.findFirst({
        where: {
          code,
          isActive: true,
        },
      });

      if (!site) {
        throw new NotFoundError('Site not found');
      }

      if (req.user.role !== 'SUPER_ADMIN') {
        const membership = await prisma.siteMembership.findUnique({
          where: {
            userId_siteId: {
              userId: req.user.id,
              siteId: site.id,
            },
          },
        });

        if (!membership) {
          throw new ForbiddenError('You do not have access to this site');
        }
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
  };
}

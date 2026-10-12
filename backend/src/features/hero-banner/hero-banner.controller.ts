import type { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import type { SiteCode } from '@/types/common';
import { sendSuccess } from '@/utils/apiResponse';
import { NotFoundError, UnauthorizedError, ValidationError } from '@/utils/AppError';
import { heroBannerService } from './hero-banner.service';
import type { HeroBannerConfigBody } from './hero-banner.validation';

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

export class HeroBannerController {
  constructor(private readonly service = heroBannerService) {}

  get = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.getForSite(req.site.id, req.site.code);
    sendSuccess(res, data, 'Hero banner config');
  };

  /** Public storefront read — active site only, active slides ordered. */
  getPublic = async (req: Request, res: Response): Promise<void> => {
    const siteCode = normalizeSiteCode(req.params.siteCode);
    const site = await prisma.site.findFirst({
      where: { code: siteCode, isActive: true },
    });
    if (!site) {
      throw new NotFoundError('Site not found');
    }

    const data = await this.service.getForSite(site.id, siteCode, {
      activeOnly: true,
    });
    sendSuccess(res, data, 'Hero banner config');
  };

  upsert = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.upsertForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      body: req.body as HeroBannerConfigBody,
    });

    sendSuccess(res, data, 'Hero banner config saved');
  };
}

export const heroBannerController = new HeroBannerController();

import type { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import type { SiteCode } from '@/types/common';
import { sendSuccess } from '@/utils/apiResponse';
import { NotFoundError, UnauthorizedError, ValidationError } from '@/utils/AppError';
import { footerService } from './footer.service';
import type { FooterConfigBody } from './footer.validation';

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

export class FooterController {
  constructor(private readonly service = footerService) {}

  get = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.getForSite(req.site.id, req.site.code);
    sendSuccess(res, data, 'Footer config');
  };

  /** Public storefront read — active site only, active nested items. */
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
    sendSuccess(res, data, 'Footer config');
  };

  upsert = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.upsertForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      body: req.body as FooterConfigBody,
    });

    sendSuccess(res, data, 'Footer config saved');
  };
}

export const footerController = new FooterController();

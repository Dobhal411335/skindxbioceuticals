import type { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import type { SiteCode } from '@/types/common';
import { sendSuccess } from '@/utils/apiResponse';
import { NotFoundError, UnauthorizedError, ValidationError } from '@/utils/AppError';
import { navbarSectionsService } from './navbar-sections.service';
import type {
  NavbarSectionBody,
  NavbarSectionPatchBody,
} from './navbar-sections.validation';

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

export class NavbarSectionsController {
  constructor(private readonly service = navbarSectionsService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.listForSite(req.site.id, req.site.code);
    sendSuccess(res, data, 'Navbar sections');
  };

  /** Public storefront read — active site + active sections only. */
  listPublic = async (req: Request, res: Response): Promise<void> => {
    const siteCode = normalizeSiteCode(req.params.siteCode);
    const site = await prisma.site.findFirst({
      where: { code: siteCode, isActive: true },
    });
    if (!site) {
      throw new NotFoundError('Site not found');
    }

    const data = await this.service.listActiveForSite(site.id, siteCode);
    sendSuccess(res, data, 'Navbar sections');
  };

  create = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.createForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      body: req.body as NavbarSectionBody,
    });

    sendSuccess(res, data, 'Navbar section created', 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.updateForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      sectionId: String(req.params.sectionId),
      body: req.body as NavbarSectionBody,
    });

    sendSuccess(res, data, 'Navbar section updated');
  };

  patchActive = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.patchActiveForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      sectionId: String(req.params.sectionId),
      body: req.body as NavbarSectionPatchBody,
    });

    sendSuccess(res, data, 'Navbar section status updated');
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    await this.service.deleteForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      sectionId: String(req.params.sectionId),
    });

    sendSuccess(res, null, 'Navbar section deleted');
  };
}

export const navbarSectionsController = new NavbarSectionsController();

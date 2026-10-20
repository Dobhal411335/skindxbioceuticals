import type { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import type { SiteCode } from '@/types/common';
import { sendSuccess } from '@/utils/apiResponse';
import { NotFoundError, UnauthorizedError, ValidationError } from '@/utils/AppError';
import { webpageService } from './webpage.service';
import type {
  WebpageContentPatchBody,
  WebpageCreateBody,
  WebpageMetaPatchBody,
} from './webpage.validation';

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

export class WebpageController {
  constructor(private readonly service = webpageService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) throw new UnauthorizedError();
    const data = await this.service.listForSite(req.site.id, req.site.code);
    sendSuccess(res, data, 'Webpages');
  };

  get = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) throw new UnauthorizedError();
    const data = await this.service.getForSite(
      req.site.id,
      req.site.code,
      String(req.params.webpageId),
    );
    sendSuccess(res, data, 'Webpage');
  };

  create = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) throw new UnauthorizedError();
    const data = await this.service.createForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      body: req.body as WebpageCreateBody,
    });
    sendSuccess(res, data, 'Webpage created', 201);
  };

  patchMeta = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) throw new UnauthorizedError();
    const data = await this.service.patchMetaForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      webpageId: String(req.params.webpageId),
      body: req.body as WebpageMetaPatchBody,
    });
    sendSuccess(res, data, 'Webpage updated');
  };

  updateContent = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) throw new UnauthorizedError();
    const data = await this.service.updateContentForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      webpageId: String(req.params.webpageId),
      body: req.body as WebpageContentPatchBody,
    });
    sendSuccess(res, data, 'Webpage content updated');
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) throw new UnauthorizedError();
    await this.service.deleteForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      webpageId: String(req.params.webpageId),
    });
    sendSuccess(res, null, 'Webpage deleted');
  };

  listPublic = async (req: Request, res: Response): Promise<void> => {
    const siteCode = normalizeSiteCode(req.params.siteCode);
    const site = await prisma.site.findFirst({
      where: { code: siteCode, isActive: true },
    });
    if (!site) throw new NotFoundError('Site not found');
    const data = await this.service.listPublicForSite(site.id, siteCode);
    sendSuccess(res, data, 'Webpages');
  };

  getPublicBySlug = async (req: Request, res: Response): Promise<void> => {
    const siteCode = normalizeSiteCode(req.params.siteCode);
    const site = await prisma.site.findFirst({
      where: { code: siteCode, isActive: true },
    });
    if (!site) throw new NotFoundError('Site not found');
    const data = await this.service.getPublicBySlug(site.id, siteCode, String(req.params.slug));
    sendSuccess(res, data, 'Webpage');
  };
}

export const webpageController = new WebpageController();

import type { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import type { SiteCode } from '@/types/common';
import { sendSuccess } from '@/utils/apiResponse';
import { NotFoundError, UnauthorizedError, ValidationError } from '@/utils/AppError';
import { galleryService } from './gallery.service';
import type { GalleryItemBody, GalleryItemPatchBody } from './gallery.validation';
import type { GalleryMediaTypeDto } from './gallery.types';

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

export class GalleryController {
  constructor(private readonly service = galleryService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const mediaType =
      typeof req.query.mediaType === 'string'
        ? (req.query.mediaType as GalleryMediaTypeDto)
        : undefined;

    const data = await this.service.listForSite(req.site.id, req.site.code, mediaType);
    sendSuccess(res, data, 'Gallery items');
  };

  /** Public storefront read — active site + active items only. */
  listPublic = async (req: Request, res: Response): Promise<void> => {
    const siteCode = normalizeSiteCode(req.params.siteCode);
    const site = await prisma.site.findFirst({
      where: { code: siteCode, isActive: true },
    });
    if (!site) {
      throw new NotFoundError('Site not found');
    }

    const data = await this.service.listActiveForSite(site.id, siteCode);
    sendSuccess(res, data, 'Gallery items');
  };

  create = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.createForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      body: req.body as GalleryItemBody,
    });

    sendSuccess(res, data, 'Gallery item created', 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.updateForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      itemId: String(req.params.itemId),
      body: req.body as GalleryItemBody,
    });

    sendSuccess(res, data, 'Gallery item updated');
  };

  patch = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.patchForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      itemId: String(req.params.itemId),
      body: req.body as GalleryItemPatchBody,
    });

    sendSuccess(res, data, 'Gallery item updated');
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    await this.service.deleteForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      itemId: String(req.params.itemId),
    });

    sendSuccess(res, null, 'Gallery item deleted');
  };
}

export const galleryController = new GalleryController();

import type { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import type { SiteCode } from '@/types/common';
import { sendSuccess } from '@/utils/apiResponse';
import { NotFoundError, UnauthorizedError, ValidationError } from '@/utils/AppError';
import { socialPostsService } from './social-posts.service';
import type {
  SocialPostBody,
  SocialPostPatchBody,
} from './social-posts.validation';
import type { SocialPostTypeDto } from './social-posts.types';

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

export class SocialPostsController {
  constructor(private readonly service = socialPostsService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const postType =
      typeof req.query.postType === 'string'
        ? (req.query.postType as SocialPostTypeDto)
        : undefined;

    const data = await this.service.listForSite(
      req.site.id,
      req.site.code,
      postType,
    );
    sendSuccess(res, data, 'Social posts');
  };

  /** Public storefront read — active site + active posts only. */
  listPublic = async (req: Request, res: Response): Promise<void> => {
    const siteCode = normalizeSiteCode(req.params.siteCode);
    const site = await prisma.site.findFirst({
      where: { code: siteCode, isActive: true },
    });
    if (!site) {
      throw new NotFoundError('Site not found');
    }

    const data = await this.service.listActiveForSite(site.id, siteCode);
    sendSuccess(res, data, 'Social posts');
  };

  create = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.createForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      body: req.body as SocialPostBody,
    });

    sendSuccess(res, data, 'Social post created', 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.updateForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      postId: String(req.params.postId),
      body: req.body as SocialPostBody,
    });

    sendSuccess(res, data, 'Social post updated');
  };

  patch = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.patchForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      postId: String(req.params.postId),
      body: req.body as SocialPostPatchBody,
    });

    sendSuccess(res, data, 'Social post updated');
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    await this.service.deleteForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      postId: String(req.params.postId),
    });

    sendSuccess(res, null, 'Social post deleted');
  };
}

export const socialPostsController = new SocialPostsController();

import type { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import type { SiteCode } from '@/types/common';
import { sendSuccess } from '@/utils/apiResponse';
import { NotFoundError, UnauthorizedError, ValidationError } from '@/utils/AppError';
import { blogService } from './blog.service';
import type {
  BlogCreateBody,
  BlogPatchBody,
  BlogUpdateBody,
} from './blog.validation';

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

export class BlogController {
  constructor(private readonly service = blogService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const category =
      typeof req.query.category === 'string' && req.query.category.trim()
        ? req.query.category.trim()
        : undefined;

    const data = await this.service.listForSite(req.site.id, req.site.code, category);
    sendSuccess(res, data, 'Blogs');
  };

  get = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.getForSite(
      req.site.id,
      req.site.code,
      String(req.params.blogId),
    );
    sendSuccess(res, data, 'Blog');
  };

  create = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.createForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      body: req.body as BlogCreateBody,
    });

    sendSuccess(res, data, 'Blog created', 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.updateForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      blogId: String(req.params.blogId),
      body: req.body as BlogUpdateBody,
    });

    sendSuccess(res, data, 'Blog updated');
  };

  patch = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.patchForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      blogId: String(req.params.blogId),
      body: req.body as BlogPatchBody,
    });

    sendSuccess(res, data, 'Blog updated');
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    await this.service.deleteForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      blogId: String(req.params.blogId),
    });

    sendSuccess(res, null, 'Blog deleted');
  };

  /** Public storefront list — active blogs only. */
  listPublic = async (req: Request, res: Response): Promise<void> => {
    const siteCode = normalizeSiteCode(req.params.siteCode);
    const site = await prisma.site.findFirst({
      where: { code: siteCode, isActive: true },
    });
    if (!site) {
      throw new NotFoundError('Site not found');
    }

    const category =
      typeof req.query.category === 'string' && req.query.category.trim()
        ? req.query.category.trim()
        : undefined;

    const recentRaw = req.query.recent;
    const recent =
      recentRaw === 'true' ||
      recentRaw === '1' ||
      (Array.isArray(recentRaw) && recentRaw[0] === 'true');

    const limitRaw =
      typeof req.query.limit === 'string'
        ? Number(req.query.limit)
        : Array.isArray(req.query.limit) && typeof req.query.limit[0] === 'string'
          ? Number(req.query.limit[0])
          : undefined;
    const limit = recent ? Math.min(limitRaw ?? 4, 4) : limitRaw;

    const [blogs, categories] = await Promise.all([
      this.service.listPublicForSite(site.id, siteCode, { category, limit }),
      this.service.listPublicCategories(site.id),
    ]);

    sendSuccess(res, { blogs, categories }, 'Blogs');
  };

  /** Public storefront detail by slug + related same-category cards. */
  getPublicBySlug = async (req: Request, res: Response): Promise<void> => {
    const siteCode = normalizeSiteCode(req.params.siteCode);
    const site = await prisma.site.findFirst({
      where: { code: siteCode, isActive: true },
    });
    if (!site) {
      throw new NotFoundError('Site not found');
    }

    const data = await this.service.getPublicBySlug(
      site.id,
      siteCode,
      String(req.params.slug),
    );
    sendSuccess(res, data, 'Blog');
  };
}

export const blogController = new BlogController();

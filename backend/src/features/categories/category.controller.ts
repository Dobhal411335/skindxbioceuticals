import type { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import type { SiteCode } from '@/types/common';
import { sendSuccess } from '@/utils/apiResponse';
import { NotFoundError, UnauthorizedError, ValidationError } from '@/utils/AppError';
import { categoryService } from './category.service';
import type {
  CategoryBody,
  CategoryPatchBody,
  SubcategoryBody,
  SubcategoryPatchBody,
} from './category.validation';

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

export class CategoryController {
  constructor(private readonly service = categoryService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }
    const data = await this.service.listRoots(req.site.id, req.site.code);
    sendSuccess(res, data, 'Categories');
  };

  listPublic = async (req: Request, res: Response): Promise<void> => {
    const siteCode = normalizeSiteCode(req.params.siteCode);
    const site = await prisma.site.findFirst({
      where: { code: siteCode, isActive: true },
    });
    if (!site) {
      throw new NotFoundError('Site not found');
    }

    const data = await this.service.listActiveRoots(site.id, siteCode);
    sendSuccess(res, data, 'Categories');
  };

  getPublicBySlug = async (req: Request, res: Response): Promise<void> => {
    const siteCode = normalizeSiteCode(req.params.siteCode);
    const site = await prisma.site.findFirst({
      where: { code: siteCode, isActive: true },
    });
    if (!site) {
      throw new NotFoundError('Site not found');
    }

    const data = await this.service.getPublicBySlugOrName(
      site.id,
      siteCode,
      decodeURIComponent(String(req.params.categorySlug)),
    );
    sendSuccess(res, data, 'Category');
  };

  create = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.createRoot({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      body: req.body as CategoryBody,
    });
    sendSuccess(res, data, 'Category created', 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.updateRoot({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      categoryId: String(req.params.categoryId),
      body: req.body as CategoryBody,
    });
    sendSuccess(res, data, 'Category updated');
  };

  patch = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.patchRoot({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      categoryId: String(req.params.categoryId),
      body: req.body as CategoryPatchBody,
    });
    sendSuccess(res, data, 'Category updated');
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    await this.service.deleteRoot({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      categoryId: String(req.params.categoryId),
    });
    sendSuccess(res, null, 'Category deleted');
  };

  listSubcategories = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.listSubcategories(
      req.site.id,
      req.site.code,
      String(req.params.categoryId),
    );
    sendSuccess(res, data, 'Subcategories');
  };

  createSubcategory = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.createSubcategory({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      categoryId: String(req.params.categoryId),
      body: req.body as SubcategoryBody,
    });
    sendSuccess(res, data, 'Subcategory created', 201);
  };

  updateSubcategory = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.updateSubcategory({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      categoryId: String(req.params.categoryId),
      subcategoryId: String(req.params.subcategoryId),
      body: req.body as SubcategoryBody,
    });
    sendSuccess(res, data, 'Subcategory updated');
  };

  patchSubcategory = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.patchSubcategory({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      categoryId: String(req.params.categoryId),
      subcategoryId: String(req.params.subcategoryId),
      body: req.body as SubcategoryPatchBody,
    });
    sendSuccess(res, data, 'Subcategory updated');
  };

  removeSubcategory = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    await this.service.deleteSubcategory({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      categoryId: String(req.params.categoryId),
      subcategoryId: String(req.params.subcategoryId),
    });
    sendSuccess(res, null, 'Subcategory deleted');
  };
}

export const categoryController = new CategoryController();

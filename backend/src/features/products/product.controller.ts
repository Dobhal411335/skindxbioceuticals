import type { Request, Response } from 'express';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import type { SiteCode } from '@/types/common';
import { sendSuccess } from '@/utils/apiResponse';
import { NotFoundError, UnauthorizedError, ValidationError } from '@/utils/AppError';
import { productService } from './product.service';
import type {
  AdminProductListQuery,
  CatalogProductBody,
  CatalogProductPatchBody,
  PublicProductListQuery,
} from './product.validation';

function pdfContentDisposition(name: string): string {
  const trimmed = name.trim() || 'document';
  const withExt = trimmed.toLowerCase().endsWith('.pdf') ? trimmed : `${trimmed}.pdf`;
  const ascii = withExt.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '');
  return `inline; filename="${ascii}"`;
}

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

export class ProductController {
  constructor(private readonly service = productService) {}

  listPublic = async (req: Request, res: Response): Promise<void> => {
    const siteCode = normalizeSiteCode(req.params.siteCode);
    const site = await prisma.site.findFirst({
      where: { code: siteCode, isActive: true },
    });
    if (!site) {
      throw new NotFoundError('Site not found');
    }

    const query = req.query as unknown as PublicProductListQuery;
    const result = await this.service.listPublic({
      siteId: site.id,
      siteCode,
      limit: query.limit ?? 15,
      page: query.page ?? 1,
      offset: query.offset,
      q: query.q,
      categorySlug: query.categorySlug,
      subcategorySlug: query.subcategorySlug,
      priceMin: query.priceMin,
      priceMax: query.priceMax,
      availability: query.availability,
      sort: query.sort ?? 'default',
      includeVendorPrice: req.user?.role === 'VENDOR',
    });
    sendSuccess(res, result.items, 'Products', 200, result.meta);
  };

  listPublicFacets = async (req: Request, res: Response): Promise<void> => {
    const siteCode = normalizeSiteCode(req.params.siteCode);
    const site = await prisma.site.findFirst({
      where: { code: siteCode, isActive: true },
    });
    if (!site) {
      throw new NotFoundError('Site not found');
    }

    const data = await this.service.getPublicFacets({
      siteId: site.id,
      siteCode,
    });
    sendSuccess(res, data, 'Product facets');
  };

  listPublicHighlights = async (req: Request, res: Response): Promise<void> => {
    const siteCode = normalizeSiteCode(req.params.siteCode);
    const site = await prisma.site.findFirst({
      where: { code: siteCode, isActive: true },
    });
    if (!site) {
      throw new NotFoundError('Site not found');
    }

    const data = await this.service.listPublicHighlights({
      siteId: site.id,
      siteCode,
      includeVendorPrice: req.user?.role === 'VENDOR',
    });
    sendSuccess(res, data, 'Product FAQ');
  };

  getPublicBySlug = async (req: Request, res: Response): Promise<void> => {
    const siteCode = normalizeSiteCode(req.params.siteCode);
    const site = await prisma.site.findFirst({
      where: { code: siteCode, isActive: true },
    });
    if (!site) {
      throw new NotFoundError('Site not found');
    }

    const data = await this.service.getPublicBySlug({
      siteId: site.id,
      siteCode,
      slug: String(req.params.slug),
      includeVendorPrice: req.user?.role === 'VENDOR',
    });
    sendSuccess(res, data, 'Product');
  };

  getPublicPdfFile = async (req: Request, res: Response): Promise<void> => {
    const siteCode = normalizeSiteCode(req.params.siteCode);
    const site = await prisma.site.findFirst({
      where: { code: siteCode, isActive: true },
    });
    if (!site) {
      throw new NotFoundError('Site not found');
    }

    const delivery = await this.service.getPublicPdfDelivery({
      siteId: site.id,
      slug: String(req.params.slug),
      pdfId: String(req.params.pdfId),
    });

    const upstream = await fetch(delivery.downloadUrl);
    if (!upstream.ok) {
      logger.warn(
        {
          event: 'public_product.pdf.delivery_failed',
          siteCode,
          slug: String(req.params.slug),
          pdfId: String(req.params.pdfId),
          statusCode: upstream.status,
        },
        'Public product PDF delivery failed',
      );
      throw new NotFoundError('PDF not found');
    }

    const bytes = Buffer.from(await upstream.arrayBuffer());
    const filename = pdfContentDisposition(delivery.name);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', filename);
    res.setHeader('Content-Length', String(bytes.length));
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.status(200).send(bytes);
  };

  listForSubcategory = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.listForSubcategory({
      siteId: req.site.id,
      siteCode: req.site.code,
      subcategoryId: String(req.params.subcategoryId),
    });
    sendSuccess(res, data, 'Products');
  };

  createForSubcategory = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.createForSubcategory({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      subcategoryId: String(req.params.subcategoryId),
      body: req.body as CatalogProductBody,
    });
    sendSuccess(res, data, 'Product created', 201);
  };

  updateForSubcategory = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.updateForSubcategory({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      subcategoryId: String(req.params.subcategoryId),
      productId: String(req.params.productId),
      body: req.body as CatalogProductBody,
    });
    sendSuccess(res, data, 'Product updated');
  };

  patchForSubcategory = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.patchForSubcategory({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      subcategoryId: String(req.params.subcategoryId),
      productId: String(req.params.productId),
      body: req.body as CatalogProductPatchBody,
    });
    sendSuccess(res, data, 'Product updated');
  };

  removeForSubcategory = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    await this.service.deleteForSubcategory({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      subcategoryId: String(req.params.subcategoryId),
      productId: String(req.params.productId),
    });
    sendSuccess(res, null, 'Product deleted');
  };

  listDirect = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.listDirect({
      siteId: req.site.id,
      siteCode: req.site.code,
    });
    sendSuccess(res, data, 'Direct products');
  };

  createDirect = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.createDirect({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      body: req.body as CatalogProductBody,
    });
    sendSuccess(res, data, 'Product created', 201);
  };

  updateDirect = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.updateDirect({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      productId: String(req.params.productId),
      body: req.body as CatalogProductBody,
    });
    sendSuccess(res, data, 'Product updated');
  };

  patchDirect = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.patchDirect({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      productId: String(req.params.productId),
      body: req.body as CatalogProductPatchBody,
    });
    sendSuccess(res, data, 'Product updated');
  };

  removeDirect = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    await this.service.deleteDirect({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      productId: String(req.params.productId),
    });
    sendSuccess(res, null, 'Product deleted');
  };

  listForAdmin = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const query = req.query as unknown as AdminProductListQuery;
    const result = await this.service.listForAdmin({
      siteId: req.site.id,
      siteCode: req.site.code,
      query,
    });
    sendSuccess(res, result.items, 'Products', 200, result.meta);
  };

  removeForSite = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    await this.service.deleteForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      productId: String(req.params.productId),
    });
    sendSuccess(res, null, 'Product deleted');
  };
}

export const productController = new ProductController();

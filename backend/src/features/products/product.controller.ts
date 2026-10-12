import type { Request, Response } from 'express';
import { sendSuccess } from '@/utils/apiResponse';
import { UnauthorizedError } from '@/utils/AppError';
import { productService } from './product.service';
import type {
  CatalogProductBody,
  CatalogProductPatchBody,
} from './product.validation';

export class ProductController {
  constructor(private readonly service = productService) {}

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
}

export const productController = new ProductController();

import type { Request, Response } from 'express';
import { productPricesService } from './product-prices.service';
import { sendSuccess } from '@/utils/apiResponse';
import { UnauthorizedError } from '@/utils/AppError';
import type {
  AdminProductPriceApplyBody,
  AdminProductPriceListQuery,
} from './product-prices.validation';

/**
 * Product-prices controller — HTTP concerns only.
 */
export class ProductPricesController {
  constructor(private readonly service = productPricesService) {}

  listPreview = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const query = req.query as unknown as AdminProductPriceListQuery;
    const result = await this.service.listForAdmin({
      siteId: req.site.id,
      siteCode: req.site.code,
      query,
    });
    sendSuccess(res, result.items, 'Product prices', 200, result.meta);
  };

  apply = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const body = req.body as AdminProductPriceApplyBody;
    const data = await this.service.applyPercent({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      body,
    });
    sendSuccess(res, data, 'Product prices updated');
  };
}

export const productPricesController = new ProductPricesController();

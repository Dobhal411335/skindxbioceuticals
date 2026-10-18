import type { Request, Response } from 'express';
import { inventoryService } from './inventory.service';
import { sendSuccess } from '@/utils/apiResponse';
import { UnauthorizedError } from '@/utils/AppError';
import type {
  AdminStockListQuery,
  AdminStockVariantQtyBody,
} from './inventory.validation';

/**
 * Inventory controller — HTTP concerns only (req/res/status).
 */
export class InventoryController {
  constructor(private readonly service = inventoryService) {}

  /**
   * Placeholder health/status handler for the public inventory mount.
   */
  status = (_req: Request, res: Response): void => {
    sendSuccess(res, { feature: 'inventory', ready: true }, 'Inventory module ready');
  };

  listStock = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const query = req.query as unknown as AdminStockListQuery;
    const result = await this.service.listForAdmin({
      siteId: req.site.id,
      siteCode: req.site.code,
      query,
    });
    sendSuccess(res, result.items, 'Stock', 200, result.meta);
  };

  updateVariantQty = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const body = req.body as AdminStockVariantQtyBody;
    const data = await this.service.updateVariantQuantity({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      variantId: String(req.params.variantId),
      quantity: body.quantity,
    });
    sendSuccess(res, data, 'Stock updated');
  };
}

export const inventoryController = new InventoryController();

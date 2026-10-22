import type { Request, Response } from 'express';
import { sendSuccess } from '@/utils/apiResponse';
import { UnauthorizedError } from '@/utils/AppError';
import { adminOrdersService } from './admin-orders.service';
import type { AdminOrderLogKind } from './admin-orders.types';
import type { AdminOrderLogQuery } from './admin-orders.validation';

export class AdminOrdersController {
  constructor(private readonly service = adminOrdersService) {}

  private list =
    (kind: AdminOrderLogKind) =>
    async (req: Request, res: Response): Promise<void> => {
      if (!req.user || !req.site) {
        throw new UnauthorizedError();
      }

      const data = await this.service.listForSite({
        siteId: req.site.id,
        siteCode: req.site.code,
        kind,
        query: req.query as unknown as AdminOrderLogQuery,
      });

      sendSuccess(
        res,
        data,
        kind === 'online'
          ? 'Online order log'
          : kind === 'vendor'
            ? 'Vendor order log'
            : 'Cancelled order log',
      );
    };

  listOnline = this.list('online');
  listCancelled = this.list('cancelled');
  listVendor = this.list('vendor');

  listEnquiry = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const data = await this.service.listEnquiryForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      query: req.query as any,
    });

    sendSuccess(res, data, 'Enquiry order log');
  };

  detail = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const orderId = String(req.params.orderId);
    const data = await this.service.getDetailForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      orderId,
    });

    sendSuccess(res, data, 'Order detail');
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) {
      throw new UnauthorizedError();
    }

    const orderId = String(req.params.orderId);
    const data = await this.service.updateStatusForSite({
      siteId: req.site.id,
      siteCode: req.site.code,
      orderId,
      body: req.body,
    });

    sendSuccess(res, data, 'Order status updated successfully');
  };
}

export const adminOrdersController = new AdminOrdersController();

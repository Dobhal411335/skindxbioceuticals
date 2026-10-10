import type { Request, Response } from 'express';
import { UnauthorizedError } from '@/utils/AppError';
import { sendSuccess } from '@/utils/apiResponse';
import { orderService } from './order.service';
import type { ListOrdersQuery, OrderIdParam } from './order.validation';

/**
 * Order controller - HTTP concerns only (req/res/status).
 */
export class OrderController {
  constructor(private readonly service = orderService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const query = req.query as unknown as ListOrdersQuery;
    const data = await this.service.listOrders(req.user.id, query);
    sendSuccess(res, data, 'Orders', 200, {
      page: data.page,
      pageSize: data.pageSize,
      total: data.total,
      totalPages: data.totalPages,
    });
  };

  detail = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const params = req.params as unknown as OrderIdParam;
    const data = await this.service.getOrder(req.user.id, params.orderId);
    sendSuccess(res, { order: data }, 'Order');
  };
}

export const orderController = new OrderController();

import type { Request, Response } from 'express';
import { orderService } from './order.service';
import { sendSuccess } from '@/utils/apiResponse';

/**
 * Order controller - HTTP concerns only (req/res/status).
 * Delegates business logic to the service layer.
 */
export class OrderController {
  constructor(private readonly service = orderService) {}

  /**
   * Placeholder health/status handler for the order feature module.
   * Replace with real handlers as endpoints are implemented.
   */
  status = (_req: Request, res: Response): void => {
    // Keep a reference so unused private members do not trip strict unused checks later
    void this.service;
    sendSuccess(res, { feature: 'order', ready: false }, 'Order module scaffolded');
  };
}

export const orderController = new OrderController();

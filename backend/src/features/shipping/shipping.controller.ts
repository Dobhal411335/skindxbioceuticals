import type { Request, Response } from 'express';
import { shippingService } from './shipping.service';
import { sendSuccess } from '@/utils/apiResponse';

/**
 * Shipping controller - HTTP concerns only (req/res/status).
 * Delegates business logic to the service layer.
 */
export class ShippingController {
  constructor(private readonly service = shippingService) {}

  /**
   * Placeholder health/status handler for the shipping feature module.
   * Replace with real handlers as endpoints are implemented.
   */
  status = (_req: Request, res: Response): void => {
    // Keep a reference so unused private members do not trip strict unused checks later
    void this.service;
    sendSuccess(res, { feature: 'shipping', ready: false }, 'Shipping module scaffolded');
  };
}

export const shippingController = new ShippingController();

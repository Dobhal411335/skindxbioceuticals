import type { Request, Response } from 'express';
import { paymentService } from './payment.service';
import { sendSuccess } from '@/utils/apiResponse';

/**
 * Payment controller - HTTP concerns only (req/res/status).
 * Delegates business logic to the service layer.
 */
export class PaymentController {
  constructor(private readonly service = paymentService) {}

  /**
   * Placeholder health/status handler for the payment feature module.
   * Replace with real handlers as endpoints are implemented.
   */
  status = (_req: Request, res: Response): void => {
    // Keep a reference so unused private members do not trip strict unused checks later
    void this.service;
    sendSuccess(res, { feature: 'payment', ready: false }, 'Payment module scaffolded');
  };
}

export const paymentController = new PaymentController();

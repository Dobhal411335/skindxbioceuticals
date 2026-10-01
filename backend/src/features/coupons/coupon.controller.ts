import type { Request, Response } from 'express';
import { couponService } from './coupon.service';
import { sendSuccess } from '@/utils/apiResponse';

/**
 * Coupon controller - HTTP concerns only (req/res/status).
 * Delegates business logic to the service layer.
 */
export class CouponController {
  constructor(private readonly service = couponService) {}

  /**
   * Placeholder health/status handler for the coupon feature module.
   * Replace with real handlers as endpoints are implemented.
   */
  status = (_req: Request, res: Response): void => {
    // Keep a reference so unused private members do not trip strict unused checks later
    void this.service;
    sendSuccess(res, { feature: 'coupon', ready: false }, 'Coupon module scaffolded');
  };
}

export const couponController = new CouponController();

import type { Request, Response } from 'express';
import { cartService } from './cart.service';
import { sendSuccess } from '@/utils/apiResponse';

/**
 * Cart controller - HTTP concerns only (req/res/status).
 * Delegates business logic to the service layer.
 */
export class CartController {
  constructor(private readonly service = cartService) {}

  /**
   * Placeholder health/status handler for the cart feature module.
   * Replace with real handlers as endpoints are implemented.
   */
  status = (_req: Request, res: Response): void => {
    // Keep a reference so unused private members do not trip strict unused checks later
    void this.service;
    sendSuccess(res, { feature: 'cart', ready: false }, 'Cart module scaffolded');
  };
}

export const cartController = new CartController();

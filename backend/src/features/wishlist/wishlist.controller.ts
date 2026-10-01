import type { Request, Response } from 'express';
import { wishlistService } from './wishlist.service';
import { sendSuccess } from '@/utils/apiResponse';

/**
 * Wishlist controller - HTTP concerns only (req/res/status).
 * Delegates business logic to the service layer.
 */
export class WishlistController {
  constructor(private readonly service = wishlistService) {}

  /**
   * Placeholder health/status handler for the wishlist feature module.
   * Replace with real handlers as endpoints are implemented.
   */
  status = (_req: Request, res: Response): void => {
    // Keep a reference so unused private members do not trip strict unused checks later
    void this.service;
    sendSuccess(res, { feature: 'wishlist', ready: false }, 'Wishlist module scaffolded');
  };
}

export const wishlistController = new WishlistController();

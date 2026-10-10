import type { Request, Response } from 'express';
import { UnauthorizedError } from '@/utils/AppError';
import { sendCreated, sendNoContent, sendSuccess } from '@/utils/apiResponse';
import { wishlistService } from './wishlist.service';
import type { AddWishlistItemInput, WishlistItemIdParam } from './wishlist.validation';

/**
 * Wishlist controller - HTTP concerns only (req/res/status).
 */
export class WishlistController {
  constructor(private readonly service = wishlistService) {}

  get = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const data = await this.service.getWishlist(req.user.id);
    sendSuccess(res, { wishlist: data }, 'Wishlist');
  };

  add = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const body = req.body as AddWishlistItemInput;
    const data = await this.service.addItem(req.user.id, body);
    sendCreated(res, { item: data }, 'Added to wishlist');
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const params = req.params as unknown as WishlistItemIdParam;
    await this.service.removeItem(req.user.id, params.itemId);
    sendNoContent(res);
  };
}

export const wishlistController = new WishlistController();

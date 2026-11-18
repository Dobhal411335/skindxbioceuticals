import type { Request, Response } from 'express';
import { UnauthorizedError, ValidationError } from '@/utils/AppError';
import { sendCreated, sendNoContent, sendSuccess } from '@/utils/apiResponse';
import { wishlistService } from './wishlist.service';
import type {
  AddWishlistItemInput,
  SyncWishlistInput,
  WishlistItemIdParam,
} from './wishlist.validation';

function requireStorefrontSite(req: Request) {
  if (!req.site) {
    throw new ValidationError('Storefront site is required');
  }
  return req.site;
}

/**
 * Wishlist controller - HTTP concerns only (req/res/status).
 */
export class WishlistController {
  constructor(private readonly service = wishlistService) {}

  get = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const site = requireStorefrontSite(req);
    const data = await this.service.getWishlist(req.user.id, site);
    sendSuccess(res, { wishlist: data }, 'Wishlist');
  };

  add = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const site = requireStorefrontSite(req);
    const body = req.body as AddWishlistItemInput;
    const data = await this.service.addItem(req.user.id, site, body);
    sendCreated(res, { item: data }, 'Added to wishlist');
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const site = requireStorefrontSite(req);
    const params = req.params as unknown as WishlistItemIdParam;
    await this.service.removeItem(req.user.id, site, params.itemId);
    sendNoContent(res);
  };

  sync = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const site = requireStorefrontSite(req);
    // Idempotency-Key is optional; wishlist union merge is naturally idempotent.
    void req.header('Idempotency-Key');
    const body = req.body as SyncWishlistInput;
    const data = await this.service.syncWishlist(req.user.id, site, body);
    sendSuccess(res, data, 'Wishlist synced');
  };
}

export const wishlistController = new WishlistController();

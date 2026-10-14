import type { Request, Response } from 'express';
import { UnauthorizedError } from '@/utils/AppError';
import { sendCreated, sendNoContent, sendSuccess } from '@/utils/apiResponse';
import { cartService } from './cart.service';
import type {
  AddCartItemInput,
  CartItemIdParam,
  SyncCartInput,
  UpdateCartItemInput,
} from './cart.validation';

/**
 * Cart controller — HTTP concerns only.
 */
export class CartController {
  constructor(private readonly service = cartService) {}

  get = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const data = await this.service.getCart(req.user.id);
    sendSuccess(res, { cart: data }, 'Cart');
  };

  add = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const body = req.body as AddCartItemInput;
    const data = await this.service.addItem(req.user.id, body);
    sendCreated(res, { item: data }, 'Added to cart');
  };

  update = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const params = req.params as unknown as CartItemIdParam;
    const body = req.body as UpdateCartItemInput;
    const data = await this.service.updateItem(req.user.id, params.itemId, body);
    sendSuccess(res, { item: data }, 'Cart item updated');
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const params = req.params as unknown as CartItemIdParam;
    await this.service.removeItem(req.user.id, params.itemId);
    sendNoContent(res);
  };

  clear = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const data = await this.service.clearCart(req.user.id);
    sendSuccess(res, { cart: data }, 'Cart cleared');
  };

  sync = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    void req.header('Idempotency-Key');
    const body = req.body as SyncCartInput;
    const data = await this.service.syncCart(req.user.id, body);
    sendSuccess(res, data, 'Cart synced');
  };
}

export const cartController = new CartController();

import { Router } from 'express';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { asyncHandler } from '@/utils/asyncHandler';
import { cartController } from './cart.controller';
import {
  addCartItemSchema,
  cartItemIdParamSchema,
  syncCartSchema,
  updateCartItemSchema,
} from './cart.validation';

/**
 * Cart routes — authenticated CUSTOMER account cart.
 */
const router = Router();

router.use(authenticate, authorize('CUSTOMER'));

router.get('/', asyncHandler(cartController.get));

router.post(
  '/items',
  validate({ body: addCartItemSchema }),
  asyncHandler(cartController.add),
);

router.patch(
  '/items/:itemId',
  validate({ params: cartItemIdParamSchema, body: updateCartItemSchema }),
  asyncHandler(cartController.update),
);

router.delete(
  '/items/:itemId',
  validate({ params: cartItemIdParamSchema }),
  asyncHandler(cartController.remove),
);

router.delete('/', asyncHandler(cartController.clear));

router.post(
  '/sync',
  validate({ body: syncCartSchema }),
  asyncHandler(cartController.sync),
);

export const cartRoutes = router;

import { Router } from 'express';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { requireStorefrontSite } from '@/middlewares/storefront-site.middleware';
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
 * Cart routes — authenticated CUSTOMER or VENDOR account cart (site-scoped).
 */
const router = Router();

router.use(requireStorefrontSite, authenticate, authorize('CUSTOMER', 'VENDOR'));

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

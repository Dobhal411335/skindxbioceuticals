import { Router } from 'express';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { asyncHandler } from '@/utils/asyncHandler';
import { wishlistController } from './wishlist.controller';
import { addWishlistItemSchema, wishlistItemIdParamSchema } from './wishlist.validation';

const router = Router();

router.use(authenticate, authorize('CUSTOMER'));

router.get('/', asyncHandler(wishlistController.get));

router.post(
  '/',
  validate({ body: addWishlistItemSchema }),
  asyncHandler(wishlistController.add),
);

router.delete(
  '/items/:itemId',
  validate({ params: wishlistItemIdParamSchema }),
  asyncHandler(wishlistController.remove),
);

export const wishlistRoutes = router;

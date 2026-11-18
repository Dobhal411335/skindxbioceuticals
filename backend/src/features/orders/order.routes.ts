import { Router } from 'express';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { requireStorefrontSite } from '@/middlewares/storefront-site.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { asyncHandler } from '@/utils/asyncHandler';
import { orderController } from './order.controller';
import { listOrdersQuerySchema, orderIdParamSchema } from './order.validation';

const router = Router();

router.use(requireStorefrontSite, authenticate, authorize('CUSTOMER', 'VENDOR'));

router.get(
  '/',
  validate({ query: listOrdersQuerySchema }),
  asyncHandler(orderController.list),
);

router.get(
  '/:orderId',
  validate({ params: orderIdParamSchema }),
  asyncHandler(orderController.detail),
);

export const orderRoutes = router;

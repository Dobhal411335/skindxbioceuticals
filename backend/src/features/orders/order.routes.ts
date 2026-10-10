import { Router } from 'express';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { asyncHandler } from '@/utils/asyncHandler';
import { orderController } from './order.controller';
import { listOrdersQuerySchema, orderIdParamSchema } from './order.validation';

const router = Router();

router.use(authenticate, authorize('CUSTOMER'));

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

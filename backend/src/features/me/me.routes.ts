import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { CLOUDINARY_CONSTANTS } from '@/lib/cloudinary';
import { asyncHandler } from '@/utils/asyncHandler';
import { meController } from './me.controller';
import {
  addressBodySchema,
  addressIdParamSchema,
  updateAddressSchema,
  updateProfileSchema,
} from './me.validation';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: CLOUDINARY_CONSTANTS.MAX_IMAGE_SIZE_BYTES },
});

router.use(authenticate, authorize('CUSTOMER'));

router.patch(
  '/',
  validate({ body: updateProfileSchema }),
  asyncHandler(meController.updateProfile),
);

router.post(
  '/avatar',
  upload.single('file'),
  asyncHandler(meController.uploadAvatar),
);

router.delete('/avatar', asyncHandler(meController.clearAvatar));

router.get('/addresses', asyncHandler(meController.listAddresses));

router.post(
  '/addresses',
  validate({ body: addressBodySchema }),
  asyncHandler(meController.createAddress),
);

router.patch(
  '/addresses/:addressId',
  validate({ params: addressIdParamSchema, body: updateAddressSchema }),
  asyncHandler(meController.updateAddress),
);

router.delete(
  '/addresses/:addressId',
  validate({ params: addressIdParamSchema }),
  asyncHandler(meController.deleteAddress),
);

export const meRoutes = router;

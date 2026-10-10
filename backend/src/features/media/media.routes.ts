import { Router } from 'express';
import multer from 'multer';
import { MediaController } from './media.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { CLOUDINARY_CONSTANTS } from '../../lib/cloudinary';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// All media routes require admin access
router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

router.post(
  '/images',
  upload.single('file'),
  MediaController.uploadImage,
);

router.post(
  '/videos',
  upload.single('file'),
  MediaController.uploadVideo,
);

router.post(
  '/documents',
  upload.single('file'),
  MediaController.uploadDocument,
);

router.post(
  '/images/bulk',
  upload.array('files', CLOUDINARY_CONSTANTS.MAX_MULTIPLE_UPLOAD_COUNT),
  MediaController.uploadImagesBulk,
);

router.delete(
  '/:assetId',
  MediaController.deleteMedia,
);

router.post(
  '/bulk-delete',
  MediaController.deleteMediaBulk,
);

export const mediaRoutes = router;

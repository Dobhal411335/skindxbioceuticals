import { Router, Request, Response } from 'express';
import multer from 'multer';
import { CLOUDINARY_CONSTANTS } from '@/lib/cloudinary/cloudinary.constants';
import { uploadSingleImage } from '@/lib/cloudinary/uploads/upload-single-image';
import { createRateLimiter } from '@/middlewares/rate-limit.middleware';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendCreated } from '@/utils/apiResponse';
import { ValidationError } from '@/utils/AppError';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: CLOUDINARY_CONSTANTS.MAX_IMAGE_SIZE_BYTES },
});

const prescriptionUploadRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyPrefix: 'checkout-prescription-upload',
});

/**
 * Public checkout endpoint to upload an optional prescription image to Cloudinary.
 * POST /api/v1/checkout/prescription
 */
router.post(
  '/prescription',
  prescriptionUploadRateLimiter,
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
      throw new ValidationError('No prescription image file uploaded');
    }

    const mime = file.mimetype.toLowerCase();
    if (!mime.startsWith('image/')) {
      throw new ValidationError('Only image files (JPG, PNG, WebP) are allowed for prescriptions');
    }

    const rawSiteCode = String(req.query.siteCode || 'IN').toUpperCase();
    const siteCode: 'IN' | 'COM' = rawSiteCode === 'COM' ? 'COM' : 'IN';

    const result = await uploadSingleImage(file, {
      siteCode,
      feature: 'prescriptions',
      entityId: 'checkout',
    });

    sendCreated(
      res,
      {
        url: result.secureUrl,
        publicId: result.publicId,
      },
      'Prescription image uploaded successfully',
    );
  }),
);

export const checkoutRoutes = router;

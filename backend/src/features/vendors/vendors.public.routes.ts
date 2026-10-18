import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { createRateLimiter } from '@/middlewares/rate-limit.middleware';
import { vendorDocumentUpload, vendorsController } from './vendors.controller';
import { vendorApplicationCreateBodySchema } from './vendors.validation';

/**
 * Public storefront routes — no authentication.
 * Mounted at `/sites/:siteCode/vendors`.
 */
export const vendorsPublicRoutes = Router({ mergeParams: true });

const applicationCreateRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
  keyPrefix: 'vendor-application-create',
});

const documentUploadRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyPrefix: 'vendor-document-upload',
});

vendorsPublicRoutes.post(
  '/applications',
  applicationCreateRateLimiter,
  validate({ params: siteCodeParamSchema, body: vendorApplicationCreateBodySchema }),
  asyncHandler(vendorsController.createPublic),
);

vendorsPublicRoutes.post(
  '/applications/documents',
  documentUploadRateLimiter,
  validate({ params: siteCodeParamSchema }),
  vendorDocumentUpload.single('file'),
  asyncHandler(vendorsController.uploadDocument),
);

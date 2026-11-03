import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { createRateLimiter } from '@/middlewares/rate-limit.middleware';
import { enquiryController } from './enquiry.controller';
import {
  enquiryCreateBodySchema,
  normalizeEnquiryCreateInput,
} from './enquiry.validation';

/**
 * Public storefront routes — no authentication.
 * Mounted at `/sites/:siteCode/enquiries`.
 */
export const enquiryPublicRoutes = Router({ mergeParams: true });

const enquiryCreateRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: 'enquiry-create',
});

enquiryPublicRoutes.post(
  '/',
  enquiryCreateRateLimiter,
  (req, _res, next) => {
    req.body = normalizeEnquiryCreateInput(req.body);
    next();
  },
  validate({ params: siteCodeParamSchema, body: enquiryCreateBodySchema }),
  asyncHandler(enquiryController.createPublic),
);

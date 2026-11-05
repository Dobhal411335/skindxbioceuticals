import { Router } from 'express';
import multer from 'multer';

import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';
import { createRateLimiter } from '@/middlewares/rate-limit.middleware';
import { ValidationError } from '@/utils/AppError';
import { RESUME_MAX_BYTES } from './career-applications.constants';
import { careerApplicationController } from './career-applications.controller';
import { careerApplicationCreateBodySchema } from './career-applications.validation';

export const careerApplicationPublicRoutes = Router({ mergeParams: true });

export const careerApplicationCreateRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyPrefix: 'career-application-create',
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: RESUME_MAX_BYTES },
});

function resumeUpload(
  req: Parameters<ReturnType<typeof upload.single>>[0],
  res: Parameters<ReturnType<typeof upload.single>>[1],
  next: Parameters<ReturnType<typeof upload.single>>[2],
): void {
  upload.single('resume')(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
    if (code === 'LIMIT_FILE_SIZE') {
      next(new ValidationError('Resume must be 5 MB or smaller'));
      return;
    }
    next(new ValidationError('Resume could not be uploaded'));
  });
}

careerApplicationPublicRoutes.post(
  '/',
  careerApplicationCreateRateLimiter,
  validate({ params: siteCodeParamSchema }),
  resumeUpload,
  validate({ body: careerApplicationCreateBodySchema }),
  asyncHandler(careerApplicationController.createPublic),
);

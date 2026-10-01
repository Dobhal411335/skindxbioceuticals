import { Router } from 'express';
import { enquiryController } from './enquiry.controller';
import { asyncHandler } from '@/utils/asyncHandler';

/**
 * Enquiry routes - wiring only (path + middleware + controller).
 * No business logic here.
 */
const router = Router();

router.get('/status', asyncHandler(enquiryController.status));

export const enquiryRoutes = router;

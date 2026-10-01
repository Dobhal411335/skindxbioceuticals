import type { Request, Response } from 'express';
import { reviewService } from './review.service';
import { sendSuccess } from '@/utils/apiResponse';

/**
 * Review controller - HTTP concerns only (req/res/status).
 * Delegates business logic to the service layer.
 */
export class ReviewController {
  constructor(private readonly service = reviewService) {}

  /**
   * Placeholder health/status handler for the review feature module.
   * Replace with real handlers as endpoints are implemented.
   */
  status = (_req: Request, res: Response): void => {
    // Keep a reference so unused private members do not trip strict unused checks later
    void this.service;
    sendSuccess(res, { feature: 'review', ready: false }, 'Review module scaffolded');
  };
}

export const reviewController = new ReviewController();

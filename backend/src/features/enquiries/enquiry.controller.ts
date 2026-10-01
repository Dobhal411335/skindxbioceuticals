import type { Request, Response } from 'express';
import { enquiryService } from './enquiry.service';
import { sendSuccess } from '@/utils/apiResponse';

/**
 * Enquiry controller - HTTP concerns only (req/res/status).
 * Delegates business logic to the service layer.
 */
export class EnquiryController {
  constructor(private readonly service = enquiryService) {}

  /**
   * Placeholder health/status handler for the enquiry feature module.
   * Replace with real handlers as endpoints are implemented.
   */
  status = (_req: Request, res: Response): void => {
    // Keep a reference so unused private members do not trip strict unused checks later
    void this.service;
    sendSuccess(res, { feature: 'enquiry', ready: false }, 'Enquiry module scaffolded');
  };
}

export const enquiryController = new EnquiryController();

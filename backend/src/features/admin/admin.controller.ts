import type { Request, Response } from 'express';
import { adminService } from './admin.service';
import { sendSuccess } from '@/utils/apiResponse';

/**
 * Admin controller - HTTP concerns only (req/res/status).
 * Delegates business logic to the service layer.
 */
export class AdminController {
  constructor(private readonly service = adminService) {}

  /**
   * Placeholder health/status handler for the admin feature module.
   * Replace with real handlers as endpoints are implemented.
   */
  status = (_req: Request, res: Response): void => {
    // Keep a reference so unused private members do not trip strict unused checks later
    void this.service;
    sendSuccess(res, { feature: 'admin', ready: false }, 'Admin module scaffolded');
  };
}

export const adminController = new AdminController();

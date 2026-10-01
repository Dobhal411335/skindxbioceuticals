import type { Request, Response } from 'express';
import { settingsService } from './settings.service';
import { sendSuccess } from '@/utils/apiResponse';

/**
 * Settings controller - HTTP concerns only (req/res/status).
 * Delegates business logic to the service layer.
 */
export class SettingsController {
  constructor(private readonly service = settingsService) {}

  /**
   * Placeholder health/status handler for the settings feature module.
   * Replace with real handlers as endpoints are implemented.
   */
  status = (_req: Request, res: Response): void => {
    // Keep a reference so unused private members do not trip strict unused checks later
    void this.service;
    sendSuccess(res, { feature: 'settings', ready: false }, 'Settings module scaffolded');
  };
}

export const settingsController = new SettingsController();

import type { Request, Response } from 'express';
import { mediaService } from './media.service';
import { sendSuccess } from '@/utils/apiResponse';

/**
 * Media controller - HTTP concerns only (req/res/status).
 * Delegates business logic to the service layer.
 */
export class MediaController {
  constructor(private readonly service = mediaService) {}

  /**
   * Placeholder health/status handler for the media feature module.
   * Replace with real handlers as endpoints are implemented.
   */
  status = (_req: Request, res: Response): void => {
    // Keep a reference so unused private members do not trip strict unused checks later
    void this.service;
    sendSuccess(res, { feature: 'media', ready: false }, 'Media module scaffolded');
  };
}

export const mediaController = new MediaController();

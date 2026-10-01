import type { Request, Response } from 'express';
import { authService } from './auth.service';
import { sendSuccess } from '@/utils/apiResponse';

/**
 * Auth controller - HTTP concerns only (req/res/status).
 * Delegates business logic to the service layer.
 */
export class AuthController {
  constructor(private readonly service = authService) {}

  /**
   * Placeholder status handler for the auth feature module.
   * Replace with register/login/refresh/logout handlers when implementing.
   */
  status = (_req: Request, res: Response): void => {
    void this.service;
    sendSuccess(res, { feature: 'auth', ready: false }, 'Auth module scaffolded');
  };
}

export const authController = new AuthController();

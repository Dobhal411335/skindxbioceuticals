import type { Request, Response } from 'express';
import { userService } from './user.service';
import { sendSuccess } from '@/utils/apiResponse';

/**
 * User controller - HTTP concerns only (req/res/status).
 * Delegates business logic to the service layer.
 */
export class UserController {
  constructor(private readonly service = userService) {}

  /**
   * Placeholder health/status handler for the user feature module.
   * Replace with real handlers as endpoints are implemented.
   */
  status = (_req: Request, res: Response): void => {
    // Keep a reference so unused private members do not trip strict unused checks later
    void this.service;
    sendSuccess(res, { feature: 'user', ready: false }, 'User module scaffolded');
  };
}

export const userController = new UserController();

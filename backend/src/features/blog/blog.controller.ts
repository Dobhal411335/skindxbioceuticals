import type { Request, Response } from 'express';
import { blogService } from './blog.service';
import { sendSuccess } from '@/utils/apiResponse';

/**
 * Blog controller - HTTP concerns only (req/res/status).
 * Delegates business logic to the service layer.
 */
export class BlogController {
  constructor(private readonly service = blogService) {}

  /**
   * Placeholder health/status handler for the blog feature module.
   * Replace with real handlers as endpoints are implemented.
   */
  status = (_req: Request, res: Response): void => {
    // Keep a reference so unused private members do not trip strict unused checks later
    void this.service;
    sendSuccess(res, { feature: 'blog', ready: false }, 'Blog module scaffolded');
  };
}

export const blogController = new BlogController();

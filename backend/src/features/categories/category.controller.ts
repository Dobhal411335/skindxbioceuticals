import type { Request, Response } from 'express';
import { categoryService } from './category.service';
import { sendSuccess } from '@/utils/apiResponse';

/**
 * Category controller - HTTP concerns only (req/res/status).
 * Delegates business logic to the service layer.
 */
export class CategoryController {
  constructor(private readonly service = categoryService) {}

  /**
   * Placeholder health/status handler for the category feature module.
   * Replace with real handlers as endpoints are implemented.
   */
  status = (_req: Request, res: Response): void => {
    // Keep a reference so unused private members do not trip strict unused checks later
    void this.service;
    sendSuccess(res, { feature: 'category', ready: false }, 'Category module scaffolded');
  };
}

export const categoryController = new CategoryController();

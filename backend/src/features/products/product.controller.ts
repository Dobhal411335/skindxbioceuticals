import type { Request, Response } from 'express';
import { productService } from './product.service';
import { sendSuccess } from '@/utils/apiResponse';

/**
 * Product controller - HTTP concerns only (req/res/status).
 * Delegates business logic to the service layer.
 */
export class ProductController {
  constructor(private readonly service = productService) {}

  /**
   * Placeholder health/status handler for the product feature module.
   * Replace with real handlers as endpoints are implemented.
   */
  status = (_req: Request, res: Response): void => {
    // Keep a reference so unused private members do not trip strict unused checks later
    void this.service;
    sendSuccess(res, { feature: 'product', ready: false }, 'Product module scaffolded');
  };
}

export const productController = new ProductController();

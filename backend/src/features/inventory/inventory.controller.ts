import type { Request, Response } from 'express';
import { inventoryService } from './inventory.service';
import { sendSuccess } from '@/utils/apiResponse';

/**
 * Inventory controller - HTTP concerns only (req/res/status).
 * Delegates business logic to the service layer.
 */
export class InventoryController {
  constructor(private readonly service = inventoryService) {}

  /**
   * Placeholder health/status handler for the inventory feature module.
   * Replace with real handlers as endpoints are implemented.
   */
  status = (_req: Request, res: Response): void => {
    // Keep a reference so unused private members do not trip strict unused checks later
    void this.service;
    sendSuccess(res, { feature: 'inventory', ready: false }, 'Inventory module scaffolded');
  };
}

export const inventoryController = new InventoryController();

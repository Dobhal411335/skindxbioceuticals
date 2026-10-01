import { inventoryRepository } from './inventory.repository';

/**
 * Inventory service - business logic layer.
 * Depends on the repository; never touches Express Request/Response.
 */
export class InventoryService {
  constructor(private readonly repository = inventoryRepository) {
    void this.repository;
  }

  // Business logic methods will be added when implementing this feature.
}

export const inventoryService = new InventoryService();

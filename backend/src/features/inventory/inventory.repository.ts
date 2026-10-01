import { prisma } from '@/lib/prisma';

/**
 * Inventory repository - Prisma data access only.
 * Controllers and services must not call Prisma directly.
 */
export class InventoryRepository {
  protected readonly db = prisma;

  constructor() {
    void this.db;
  }

  // Data-access methods will be added when implementing this feature.
}

export const inventoryRepository = new InventoryRepository();

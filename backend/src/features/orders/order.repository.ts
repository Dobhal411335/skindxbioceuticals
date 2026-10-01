import { prisma } from '@/lib/prisma';

/**
 * Order repository - Prisma data access only.
 * Controllers and services must not call Prisma directly.
 */
export class OrderRepository {
  protected readonly db = prisma;

  constructor() {
    void this.db;
  }

  // Data-access methods will be added when implementing this feature.
}

export const orderRepository = new OrderRepository();

import { prisma } from '@/lib/prisma';

/**
 * Wishlist repository - Prisma data access only.
 * Controllers and services must not call Prisma directly.
 */
export class WishlistRepository {
  protected readonly db = prisma;

  constructor() {
    void this.db;
  }

  // Data-access methods will be added when implementing this feature.
}

export const wishlistRepository = new WishlistRepository();

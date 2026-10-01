import { wishlistRepository } from './wishlist.repository';

/**
 * Wishlist service - business logic layer.
 * Depends on the repository; never touches Express Request/Response.
 */
export class WishlistService {
  constructor(private readonly repository = wishlistRepository) {
    void this.repository;
  }

  // Business logic methods will be added when implementing this feature.
}

export const wishlistService = new WishlistService();

import { cartRepository } from './cart.repository';

/**
 * Cart service - business logic layer.
 * Depends on the repository; never touches Express Request/Response.
 */
export class CartService {
  constructor(private readonly repository = cartRepository) {
    void this.repository;
  }

  // Business logic methods will be added when implementing this feature.
}

export const cartService = new CartService();

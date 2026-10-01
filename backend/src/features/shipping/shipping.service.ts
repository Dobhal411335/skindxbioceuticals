import { shippingRepository } from './shipping.repository';

/**
 * Shipping service - business logic layer.
 * Depends on the repository; never touches Express Request/Response.
 */
export class ShippingService {
  constructor(private readonly repository = shippingRepository) {
    void this.repository;
  }

  // Business logic methods will be added when implementing this feature.
}

export const shippingService = new ShippingService();

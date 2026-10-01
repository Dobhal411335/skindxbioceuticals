import { orderRepository } from './order.repository';

/**
 * Order service - business logic layer.
 * Depends on the repository; never touches Express Request/Response.
 */
export class OrderService {
  constructor(private readonly repository = orderRepository) {
    void this.repository;
  }

  // Business logic methods will be added when implementing this feature.
}

export const orderService = new OrderService();

import { paymentRepository } from './payment.repository';

/**
 * Payment service - business logic layer.
 * Depends on the repository; never touches Express Request/Response.
 */
export class PaymentService {
  constructor(private readonly repository = paymentRepository) {
    void this.repository;
  }

  // Business logic methods will be added when implementing this feature.
}

export const paymentService = new PaymentService();

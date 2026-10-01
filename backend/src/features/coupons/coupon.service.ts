import { couponRepository } from './coupon.repository';

/**
 * Coupon service - business logic layer.
 * Depends on the repository; never touches Express Request/Response.
 */
export class CouponService {
  constructor(private readonly repository = couponRepository) {
    void this.repository;
  }

  // Business logic methods will be added when implementing this feature.
}

export const couponService = new CouponService();

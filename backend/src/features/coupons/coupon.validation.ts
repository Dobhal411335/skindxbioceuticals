import { z } from 'zod';

/**
 * Zod schemas for the coupon feature.
 * Add request validation schemas as endpoints are implemented.
 */

export const couponIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type CouponIdParam = z.infer<typeof couponIdParamSchema>;

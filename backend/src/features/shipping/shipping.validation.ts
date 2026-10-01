import { z } from 'zod';

/**
 * Zod schemas for the shipping feature.
 * Add request validation schemas as endpoints are implemented.
 */

export const shippingIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type ShippingIdParam = z.infer<typeof shippingIdParamSchema>;

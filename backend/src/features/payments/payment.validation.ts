import { z } from 'zod';

/**
 * Zod schemas for the payment feature.
 * Add request validation schemas as endpoints are implemented.
 */

export const paymentIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type PaymentIdParam = z.infer<typeof paymentIdParamSchema>;

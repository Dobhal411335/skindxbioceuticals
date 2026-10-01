import { z } from 'zod';

/**
 * Zod schemas for the order feature.
 * Add request validation schemas as endpoints are implemented.
 */

export const orderIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type OrderIdParam = z.infer<typeof orderIdParamSchema>;

import { z } from 'zod';

/**
 * Zod schemas for the product feature.
 * Add request validation schemas as endpoints are implemented.
 */

export const productIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type ProductIdParam = z.infer<typeof productIdParamSchema>;

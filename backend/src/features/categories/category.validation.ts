import { z } from 'zod';

/**
 * Zod schemas for the category feature.
 * Add request validation schemas as endpoints are implemented.
 */

export const categoryIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type CategoryIdParam = z.infer<typeof categoryIdParamSchema>;

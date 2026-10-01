import { z } from 'zod';

/**
 * Zod schemas for the review feature.
 * Add request validation schemas as endpoints are implemented.
 */

export const reviewIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type ReviewIdParam = z.infer<typeof reviewIdParamSchema>;

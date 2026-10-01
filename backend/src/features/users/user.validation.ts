import { z } from 'zod';

/**
 * Zod schemas for the user feature.
 * Add request validation schemas as endpoints are implemented.
 */

export const userIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type UserIdParam = z.infer<typeof userIdParamSchema>;

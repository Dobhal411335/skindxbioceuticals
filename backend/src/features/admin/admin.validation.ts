import { z } from 'zod';

/**
 * Zod schemas for the admin feature.
 * Add request validation schemas as endpoints are implemented.
 */

export const adminIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type AdminIdParam = z.infer<typeof adminIdParamSchema>;

import { z } from 'zod';

/**
 * Zod schemas for the blog feature.
 * Add request validation schemas as endpoints are implemented.
 */

export const blogIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type BlogIdParam = z.infer<typeof blogIdParamSchema>;

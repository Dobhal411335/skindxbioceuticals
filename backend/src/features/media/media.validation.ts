import { z } from 'zod';

/**
 * Zod schemas for the media feature.
 * Add request validation schemas as endpoints are implemented.
 */

export const mediaIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type MediaIdParam = z.infer<typeof mediaIdParamSchema>;

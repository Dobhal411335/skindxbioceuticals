import { z } from 'zod';

/**
 * Zod schemas for the cart feature.
 * Add request validation schemas as endpoints are implemented.
 */

export const cartIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type CartIdParam = z.infer<typeof cartIdParamSchema>;

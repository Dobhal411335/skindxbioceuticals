import { z } from 'zod';

/**
 * Zod schemas for the wishlist feature.
 * Add request validation schemas as endpoints are implemented.
 */

export const wishlistIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type WishlistIdParam = z.infer<typeof wishlistIdParamSchema>;

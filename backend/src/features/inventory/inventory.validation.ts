import { z } from 'zod';

/**
 * Zod schemas for the inventory feature.
 * Add request validation schemas as endpoints are implemented.
 */

export const inventoryIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type InventoryIdParam = z.infer<typeof inventoryIdParamSchema>;

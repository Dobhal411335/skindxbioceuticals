import { z } from 'zod';

export const addCartItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(99).optional().default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(99),
});

export const cartItemIdParamSchema = z.object({
  itemId: z.string().uuid(),
});

export const syncCartItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

export const syncCartSchema = z.object({
  items: z.array(syncCartItemSchema).max(100),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type CartItemIdParam = z.infer<typeof cartItemIdParamSchema>;
export type SyncCartInput = z.infer<typeof syncCartSchema>;

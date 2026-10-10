import { z } from 'zod';

export const addWishlistItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional().nullable(),
});

export const wishlistItemIdParamSchema = z.object({
  itemId: z.string().uuid(),
});

export type AddWishlistItemInput = z.infer<typeof addWishlistItemSchema>;
export type WishlistItemIdParam = z.infer<typeof wishlistItemIdParamSchema>;

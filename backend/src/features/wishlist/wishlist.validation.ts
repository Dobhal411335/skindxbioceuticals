import { z } from 'zod';

export const addWishlistItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional().nullable(),
});

export const wishlistItemIdParamSchema = z.object({
  itemId: z.string().uuid(),
});

export const syncWishlistItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional().nullable(),
});

export const syncWishlistSchema = z.object({
  items: z.array(syncWishlistItemSchema).max(100),
});

export type AddWishlistItemInput = z.infer<typeof addWishlistItemSchema>;
export type WishlistItemIdParam = z.infer<typeof wishlistItemIdParamSchema>;
export type SyncWishlistInput = z.infer<typeof syncWishlistSchema>;
export type SyncWishlistItemInput = z.infer<typeof syncWishlistItemSchema>;
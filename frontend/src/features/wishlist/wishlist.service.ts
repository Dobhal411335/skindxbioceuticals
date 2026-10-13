import { apiClient } from "@/services/api/axios";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import type {
  Wishlist,
  WishlistItem,
  WishlistSyncPayload,
  WishlistSyncResult,
} from "@/features/wishlist/wishlist.types";

type Envelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export const wishlistService = {
  async get(): Promise<Wishlist> {
    const response = await apiClient.get<Envelope<{ wishlist: Wishlist }>>(
      API_ENDPOINTS.WISHLIST.ROOT,
    );
    return response.data.data.wishlist;
  },

  async add(payload: { productId: string; variantId?: string | null }): Promise<WishlistItem> {
    const response = await apiClient.post<Envelope<{ item: WishlistItem }>>(
      API_ENDPOINTS.WISHLIST.ROOT,
      payload,
    );
    return response.data.data.item;
  },

  async remove(itemId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.WISHLIST.ITEM(itemId));
  },

  async sync(
    payload: WishlistSyncPayload,
    idempotencyKey?: string,
  ): Promise<WishlistSyncResult> {
    const response = await apiClient.post<Envelope<WishlistSyncResult>>(
      API_ENDPOINTS.WISHLIST.SYNC,
      payload,
      idempotencyKey
        ? { headers: { "Idempotency-Key": idempotencyKey } }
        : undefined,
    );
    return response.data.data;
  },
};

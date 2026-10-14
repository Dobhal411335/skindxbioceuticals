import { apiClient } from "@/services/api/axios";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import type {
  AccountCart,
  AccountCartItem,
  CartSyncPayload,
  CartSyncResult,
} from "@/features/cart/cart.types";

type Envelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export const cartService = {
  async get(): Promise<AccountCart> {
    const response = await apiClient.get<Envelope<{ cart: AccountCart }>>(
      API_ENDPOINTS.CART.ROOT,
    );
    return response.data.data.cart;
  },

  async addItem(payload: {
    productId: string;
    variantId: string;
    quantity?: number;
  }): Promise<AccountCartItem> {
    const response = await apiClient.post<Envelope<{ item: AccountCartItem }>>(
      API_ENDPOINTS.CART.ITEMS,
      payload,
    );
    return response.data.data.item;
  },

  async updateItem(
    itemId: string,
    payload: { quantity: number },
  ): Promise<AccountCartItem> {
    const response = await apiClient.patch<Envelope<{ item: AccountCartItem }>>(
      API_ENDPOINTS.CART.ITEM(itemId),
      payload,
    );
    return response.data.data.item;
  },

  async removeItem(itemId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.CART.ITEM(itemId));
  },

  async clear(): Promise<AccountCart> {
    const response = await apiClient.delete<Envelope<{ cart: AccountCart }>>(
      API_ENDPOINTS.CART.ROOT,
    );
    return response.data.data.cart;
  },

  async sync(
    payload: CartSyncPayload,
    idempotencyKey?: string,
  ): Promise<CartSyncResult> {
    const response = await apiClient.post<Envelope<CartSyncResult>>(
      API_ENDPOINTS.CART.SYNC,
      payload,
      idempotencyKey
        ? { headers: { "Idempotency-Key": idempotencyKey } }
        : undefined,
    );
    return response.data.data;
  },
};

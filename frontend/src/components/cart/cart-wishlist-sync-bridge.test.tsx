/**
 * @jest-environment jsdom
 */
import { render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

import {
  __resetWishlistSyncBridgeForTests,
  CartWishlistSyncBridge,
} from "@/components/cart/cart-wishlist-sync-bridge";
import authReducer, { setCredentials } from "@/store/slices/authSlice";
import cartReducer from "@/store/slices/cartSlice";
import wishlistReducer from "@/store/slices/wishlistSlice";
import {
  ACCOUNT_CART_CACHE_KEY,
  writeAccountCartCache,
} from "@/lib/guest-cart-storage";
import {
  GUEST_WISHLIST_STORAGE_KEY,
  writeGuestWishlist,
} from "@/lib/guest-wishlist-storage";

const getWishlistMock = jest.fn();
const syncWishlistMock = jest.fn();
const getCartMock = jest.fn();
const syncCartMock = jest.fn();
const addCartItemMock = jest.fn();
const updateCartItemMock = jest.fn();

jest.mock("@/features/wishlist/wishlist.service", () => ({
  wishlistService: {
    get: (...args: unknown[]) => getWishlistMock(...args),
    sync: (...args: unknown[]) => syncWishlistMock(...args),
  },
}));

jest.mock("@/features/cart/cart.service", () => ({
  cartService: {
    get: (...args: unknown[]) => getCartMock(...args),
    sync: (...args: unknown[]) => syncCartMock(...args),
    addItem: (...args: unknown[]) => addCartItemMock(...args),
    updateItem: (...args: unknown[]) => updateCartItemMock(...args),
  },
}));

jest.mock("@/lib/toast", () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
}));

const PRODUCT_ID = "11111111-1111-4111-8111-111111111111";
const PRODUCT_ID_B = "44444444-4444-4444-8444-444444444444";
const VARIANT_A = "22222222-2222-4222-8222-222222222222";
const VARIANT_B = "33333333-3333-4333-8333-333333333333";
const VARIANT_C = "55555555-5555-4555-8555-555555555555";

function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      wishlist: wishlistReducer,
      cart: cartReducer,
    },
  });
}

describe("CartWishlistSyncBridge", () => {
  beforeEach(() => {
    window.localStorage.clear();
    getWishlistMock.mockReset();
    syncWishlistMock.mockReset();
    getCartMock.mockReset();
    syncCartMock.mockReset();
    addCartItemMock.mockReset();
    updateCartItemMock.mockReset();
    getCartMock.mockResolvedValue({ id: "cart-1", items: [] });
    getWishlistMock.mockResolvedValue({ id: "w1", items: [] });
    __resetWishlistSyncBridgeForTests();
  });

  it("hydrates guest wishlist from localStorage when unauthenticated", async () => {
    writeGuestWishlist([
      {
        productId: PRODUCT_ID,
        productName: "Serum",
        productSlug: "serum",
      },
    ]);

    const store = makeStore();
    store.dispatch({ type: "auth/setAuthStatus", payload: "unauthenticated" });

    render(
      <Provider store={store}>
        <CartWishlistSyncBridge />
      </Provider>,
    );

    await waitFor(() => {
      expect(store.getState().wishlist.items).toHaveLength(1);
      expect(store.getState().wishlist.items[0]?.productId).toBe(PRODUCT_ID);
    });
  });

  it("syncs guest bag on auth, applies server state, and clears localStorage", async () => {
    writeGuestWishlist([{ productId: PRODUCT_ID, productSlug: "serum" }]);
    syncWishlistMock.mockResolvedValue({
      wishlist: {
        id: "w1",
        items: [
          {
            id: "server-1",
            productId: PRODUCT_ID,
            variantId: null,
            productName: "Serum",
            productSlug: "serum",
            imageUrl: null,
            price: "10",
            currency: "INR",
            available: true,
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      },
      skipped: [] as Array<{
        productId: string;
        variantId?: string | null;
        reason: "INVALID_PRODUCT" | "INACTIVE_OR_WRONG_SITE" | "INVALID_VARIANT";
      }>,
    });

    const store = makeStore();
    store.dispatch(
      setCredentials({
        user: {
          id: "user-1",
          email: "a@b.com",
          role: "CUSTOMER",
          firstName: "Ada",
          lastName: null,
          imageUrl: null,
          hasPassword: true,
          linkedProviders: [],
          createdAt: "2026-01-01T00:00:00.000Z",
        },
        accessToken: "token",
      }),
    );

    render(
      <Provider store={store}>
        <CartWishlistSyncBridge />
      </Provider>,
    );

    await waitFor(() => {
      expect(syncWishlistMock).toHaveBeenCalled();
      expect(getCartMock).toHaveBeenCalled();
      expect(store.getState().wishlist.items[0]?.id).toBe("server-1");
      expect(window.localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY)).toBeNull();
    });
  });

  it("keeps account-cache-only products when DB has fewer lines", async () => {
    writeAccountCartCache([
      {
        productId: PRODUCT_ID,
        variantId: VARIANT_A,
        quantity: 1,
        productName: "A",
      },
      {
        productId: PRODUCT_ID,
        variantId: VARIANT_B,
        quantity: 1,
        productName: "B",
      },
      {
        productId: PRODUCT_ID_B,
        variantId: VARIANT_C,
        quantity: 1,
        productName: "C",
      },
    ]);

    getCartMock.mockResolvedValue({
      id: "cart-1",
      items: [
        {
          id: "server-a",
          productId: PRODUCT_ID,
          variantId: VARIANT_A,
          productName: "A",
          productSlug: "a",
          variantName: "Default",
          imageUrl: null,
          quantity: 1,
          listPrice: "10",
          unitPrice: "10",
          discountAmount: "0",
          discountCode: null,
          currency: "INR",
          availableQuantity: 5,
          available: true,
          coupon: null,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "server-b",
          productId: PRODUCT_ID,
          variantId: VARIANT_B,
          productName: "B",
          productSlug: "b",
          variantName: "Default",
          imageUrl: null,
          quantity: 1,
          listPrice: "10",
          unitPrice: "10",
          discountAmount: "0",
          discountCode: null,
          currency: "INR",
          availableQuantity: 5,
          available: true,
          coupon: null,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });

    addCartItemMock.mockResolvedValue({
      id: "server-c",
      productId: PRODUCT_ID_B,
      variantId: VARIANT_C,
      productName: "C",
      productSlug: "c",
      variantName: "Default",
      imageUrl: null,
      quantity: 1,
      listPrice: "10",
      unitPrice: "10",
      discountAmount: "0",
      discountCode: null,
      currency: "INR",
      availableQuantity: 5,
      available: true,
      coupon: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    const store = makeStore();
    store.dispatch(
      setCredentials({
        user: {
          id: "user-merge",
          email: "merge@b.com",
          role: "CUSTOMER",
          firstName: "Merge",
          lastName: null,
          imageUrl: null,
          hasPassword: true,
          linkedProviders: [],
          createdAt: "2026-01-01T00:00:00.000Z",
        },
        accessToken: "token",
      }),
    );

    render(
      <Provider store={store}>
        <CartWishlistSyncBridge />
      </Provider>,
    );

    await waitFor(() => {
      expect(getCartMock).toHaveBeenCalled();
      expect(syncCartMock).not.toHaveBeenCalled();
      expect(addCartItemMock).toHaveBeenCalledWith({
        productId: PRODUCT_ID_B,
        variantId: VARIANT_C,
        quantity: 1,
      });
      expect(store.getState().cart.items).toHaveLength(3);
      expect(window.localStorage.getItem(ACCOUNT_CART_CACHE_KEY)).not.toBeNull();
    });
  });

  it("keeps guest localStorage when sync fails", async () => {
    writeGuestWishlist([{ productId: PRODUCT_ID }]);
    syncWishlistMock.mockRejectedValue(new Error("network"));

    const store = makeStore();
    store.dispatch(
      setCredentials({
        user: {
          id: "user-2",
          email: "c@d.com",
          role: "CUSTOMER",
          firstName: "Grace",
          lastName: null,
          imageUrl: null,
          hasPassword: true,
          linkedProviders: [],
          createdAt: "2026-01-01T00:00:00.000Z",
        },
        accessToken: "token",
      }),
    );

    render(
      <Provider store={store}>
        <CartWishlistSyncBridge />
      </Provider>,
    );

    await waitFor(() => {
      expect(syncWishlistMock).toHaveBeenCalled();
      expect(window.localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY)).not.toBeNull();
    });
  });

  it("skips wishlist account sync for VENDOR (API is CUSTOMER-only)", async () => {
    writeGuestWishlist([{ productId: PRODUCT_ID, productSlug: "serum" }]);

    const store = makeStore();
    store.dispatch(
      setCredentials({
        user: {
          id: "vendor-1",
          email: "vendor@example.com",
          role: "VENDOR",
          firstName: "Vendor",
          lastName: null,
          imageUrl: null,
          hasPassword: true,
          linkedProviders: [],
          createdAt: "2026-01-01T00:00:00.000Z",
        },
        accessToken: "token",
      }),
    );

    render(
      <Provider store={store}>
        <CartWishlistSyncBridge />
      </Provider>,
    );

    await waitFor(() => {
      expect(getCartMock).toHaveBeenCalled();
    });
    expect(getWishlistMock).not.toHaveBeenCalled();
    expect(syncWishlistMock).not.toHaveBeenCalled();
    expect(store.getState().wishlist.items[0]?.productId).toBe(PRODUCT_ID);
    expect(window.localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY)).not.toBeNull();
  });
});

/**
 * @jest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import type { ReactNode } from "react";
import { createElement } from "react";

import { useWishlistActions } from "@/hooks/useWishlistActions";
import {
  GUEST_WISHLIST_STORAGE_KEY,
  readGuestWishlist,
} from "@/lib/guest-wishlist-storage";
import authReducer from "@/store/slices/authSlice";
import wishlistReducer from "@/store/slices/wishlistSlice";

const addMock = jest.fn();
const removeMock = jest.fn();

jest.mock("@/features/wishlist/wishlist.service", () => ({
  wishlistService: {
    add: (...args: unknown[]) => addMock(...args),
    remove: (...args: unknown[]) => removeMock(...args),
    get: jest.fn(),
  },
}));

jest.mock("@/lib/toast", () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
}));

const PRODUCT_ID = "11111111-1111-4111-8111-111111111111";

function wrapperFor(store: ReturnType<typeof configureStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(Provider, { store, children });
  };
}

describe("useWishlistActions", () => {
  beforeEach(() => {
    window.localStorage.clear();
    addMock.mockReset();
    removeMock.mockReset();
  });

  it("adds and removes guest wishlist items in Redux and localStorage", async () => {
    const store = configureStore({
      reducer: {
        auth: authReducer,
        wishlist: wishlistReducer,
      },
    });
    store.dispatch({ type: "auth/setAuthStatus", payload: "unauthenticated" });

    const { result } = renderHook(() => useWishlistActions(), {
      wrapper: wrapperFor(store),
    });

    await act(async () => {
      const ok = await result.current.add({
        productId: PRODUCT_ID,
        productName: "Serum",
        productSlug: "serum",
      });
      expect(ok).toBe(true);
    });

    expect(store.getState().wishlist.items).toHaveLength(1);
    expect(readGuestWishlist().items).toHaveLength(1);
    expect(readGuestWishlist().items[0]?.productId).toBe(PRODUCT_ID);

    const itemId = store.getState().wishlist.items[0]!.id;
    await act(async () => {
      await result.current.remove(itemId);
    });

    await waitFor(() => {
      expect(store.getState().wishlist.items).toHaveLength(0);
      expect(window.localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY)).toBe(
        JSON.stringify({ version: 1, items: [] }),
      );
    });
    expect(addMock).not.toHaveBeenCalled();
  });
});

/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

import { WishlistPageView } from "@/components/account/wishlist-page-view";
import { CartUiProvider } from "@/components/cart/cart-ui-context";
import authReducer from "@/store/slices/authSlice";
import cartReducer from "@/store/slices/cartSlice";
import wishlistReducer, { setWishlistItems } from "@/store/slices/wishlistSlice";

const fetchProductBySlugClientMock = jest.fn();
const writeGuestWishlistMock = jest.fn(() => true);

jest.mock("@/lib/toast", () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
}));

jest.mock("@/features/products/product.service", () => ({
  fetchProductBySlugClient: (...args: unknown[]) =>
    fetchProductBySlugClientMock(...args),
}));

jest.mock("@/lib/guest-wishlist-storage", () => {
  const actual = jest.requireActual("@/lib/guest-wishlist-storage");
  return {
    ...actual,
    writeGuestWishlist: (...args: unknown[]) => writeGuestWishlistMock(...args),
  };
});

function renderWithStore(wishlistItems: Parameters<typeof setWishlistItems>[0] = []) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      cart: cartReducer,
      wishlist: wishlistReducer,
    },
  });
  store.dispatch({ type: "auth/setAuthStatus", payload: "unauthenticated" });
  store.dispatch(setWishlistItems(wishlistItems));
  return render(
    <Provider store={store}>
      <CartUiProvider>
        <WishlistPageView />
      </CartUiProvider>
    </Provider>,
  );
}

const guestItem = {
  id: "guest:11111111-1111-4111-8111-111111111111",
  productId: "11111111-1111-4111-8111-111111111111",
  variantId: "22222222-2222-4222-8222-222222222222",
  productName: "Barrier Serum",
  productSlug: "barrier-serum",
  imageUrl: null,
  price: "1299",
  currency: "INR",
  available: true,
  quantity: 5,
  createdAt: "2026-01-01T00:00:00.000Z",
} as const;

describe("WishlistPageView", () => {
  beforeEach(() => {
    fetchProductBySlugClientMock.mockReset();
    writeGuestWishlistMock.mockReset();
    writeGuestWishlistMock.mockReturnValue(true);
  });

  it("shows empty wishlist state for guests", async () => {
    renderWithStore([]);
    expect(await screen.findByText(/your wishlist is empty/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /discover products/i })).toHaveAttribute(
      "href",
      "/category",
    );
  });

  it("lists items and exposes remove for guest bags", async () => {
    fetchProductBySlugClientMock.mockResolvedValue({
      id: guestItem.productId,
      slug: guestItem.productSlug,
      coupon: null,
      tax: null,
      variants: [{ id: guestItem.variantId, quantity: 5, price: 1299 }],
    });

    renderWithStore([guestItem]);

    expect(await screen.findByText("Barrier Serum")).toBeInTheDocument();
    expect(screen.getByText("In stock")).toBeInTheDocument();
    expect(screen.getAllByText("5 left").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /^remove$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /view details/i }),
    ).toHaveAttribute("href", "/products/barrier-serum");
  });

  it("refreshes guest stock qty from PDP even when localStorage already has a quantity", async () => {
    fetchProductBySlugClientMock.mockResolvedValue({
      id: guestItem.productId,
      slug: guestItem.productSlug,
      coupon: null,
      tax: null,
      variants: [{ id: guestItem.variantId, quantity: 20, price: 1299 }],
    });

    renderWithStore([guestItem]);

    await waitFor(() => {
      expect(fetchProductBySlugClientMock).toHaveBeenCalledWith("barrier-serum");
    });
    expect(await screen.findByText("20 left")).toBeInTheDocument();
    expect(screen.queryByText("5 left")).not.toBeInTheDocument();
    expect(writeGuestWishlistMock).toHaveBeenCalled();
    const persisted = writeGuestWishlistMock.mock.calls[0]?.[0] as Array<{
      quantity?: number;
    }>;
    expect(persisted[0]?.quantity).toBe(20);
  });

  it("refreshes guest price and coupon from PDP when localStorage has stale values", async () => {
    fetchProductBySlugClientMock.mockResolvedValue({
      id: guestItem.productId,
      slug: guestItem.productSlug,
      coupon: {
        couponId: "c1",
        code: "SAVE10",
        type: "PERCENTAGE",
        value: 10,
      },
      tax: { cgst: 9, sgst: 9 },
      variants: [{ id: guestItem.variantId, quantity: 8, price: 163.71 }],
    });

    renderWithStore([{ ...guestItem, price: "148.5", quantity: 5 }]);

    await waitFor(() => {
      expect(fetchProductBySlugClientMock).toHaveBeenCalledWith("barrier-serum");
    });

    // Updated list price after admin percent change (formatted as INR).
    expect(await screen.findByText(/163\.71/)).toBeInTheDocument();
    expect(screen.queryByText(/148\.5/)).not.toBeInTheDocument();
    expect(await screen.findByText("8 left")).toBeInTheDocument();

    expect(writeGuestWishlistMock).toHaveBeenCalled();
    const persisted = writeGuestWishlistMock.mock.calls[0]?.[0] as Array<{
      price?: string | null;
      quantity?: number;
      coupon?: { code: string } | null;
      cgstPercent?: number;
      sgstPercent?: number;
    }>;
    expect(persisted[0]?.price).toBe("163.71");
    expect(persisted[0]?.quantity).toBe(8);
    expect(persisted[0]?.coupon?.code).toBe("SAVE10");
    expect(persisted[0]?.cgstPercent).toBe(9);
    expect(persisted[0]?.sgstPercent).toBe(9);
  });
});

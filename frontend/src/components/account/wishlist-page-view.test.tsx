/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

import { WishlistPageView } from "@/components/account/wishlist-page-view";
import authReducer from "@/store/slices/authSlice";
import wishlistReducer, { setWishlistItems } from "@/store/slices/wishlistSlice";

jest.mock("@/lib/toast", () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
}));

function renderWithStore(wishlistItems: Parameters<typeof setWishlistItems>[0] = []) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      wishlist: wishlistReducer,
    },
  });
  store.dispatch({ type: "auth/setAuthStatus", payload: "unauthenticated" });
  store.dispatch(setWishlistItems(wishlistItems));
  return render(
    <Provider store={store}>
      <WishlistPageView />
    </Provider>,
  );
}

describe("WishlistPageView", () => {
  it("shows empty wishlist state for guests", async () => {
    renderWithStore([]);
    expect(await screen.findByText(/your wishlist is empty/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /discover products/i })).toHaveAttribute(
      "href",
      "/category",
    );
  });

  it("lists items and exposes remove for guest bags", async () => {
    renderWithStore([
      {
        id: "guest:11111111-1111-4111-8111-111111111111",
        productId: "11111111-1111-4111-8111-111111111111",
        variantId: null,
        productName: "Barrier Serum",
        productSlug: "barrier-serum",
        imageUrl: null,
        price: "1299",
        currency: "INR",
        available: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ]);

    expect(await screen.findByText("Barrier Serum")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view product/i })).toHaveAttribute(
      "href",
      "/products/barrier-serum",
    );
  });
});

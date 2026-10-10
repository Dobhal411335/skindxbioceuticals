import { render, screen } from "@testing-library/react";

import { WishlistPageView } from "@/components/account/wishlist-page-view";

const getMock = jest.fn();

jest.mock("@/features/wishlist/wishlist.service", () => ({
  wishlistService: {
    get: (...args: unknown[]) => getMock(...args),
    remove: jest.fn(),
  },
}));

describe("WishlistPageView", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it("shows empty wishlist state", async () => {
    getMock.mockResolvedValue({ id: "w1", items: [] });
    render(<WishlistPageView />);
    expect(await screen.findByText(/your wishlist is empty/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /discover products/i })).toHaveAttribute(
      "href",
      "/shop",
    );
  });
});

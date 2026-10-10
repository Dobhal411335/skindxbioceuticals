import { render, screen, waitFor } from "@testing-library/react";

import { OrdersPageView } from "@/components/account/orders-page-view";

const listMock = jest.fn();

jest.mock("@/features/orders/order.service", () => ({
  orderService: {
    list: (...args: unknown[]) => listMock(...args),
  },
}));

describe("OrdersPageView", () => {
  beforeEach(() => {
    listMock.mockReset();
  });

  it("shows empty state with start shopping CTA", async () => {
    listMock.mockResolvedValue({
      orders: [],
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 1,
    });

    render(<OrdersPageView />);

    expect(
      await screen.findByText(/you haven't placed any orders yet/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /start shopping/i })).toHaveAttribute(
      "href",
      "/shop",
    );
  });

  it("shows API failure state", async () => {
    listMock.mockRejectedValue(new Error("Network down"));

    render(<OrdersPageView />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});

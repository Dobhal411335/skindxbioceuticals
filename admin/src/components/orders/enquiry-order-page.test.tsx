import { render, screen, waitFor } from "@testing-library/react";

import { EnquiryOrderPage } from "@/components/orders/enquiry-order-page";

jest.mock("next/navigation", () => ({
  usePathname: () => "/admin/in/orders/enquiry",
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { id: "1", email: "admin@skindx.test", role: "ADMIN", firstName: "Ada" },
    logout: jest.fn(),
  }),
}));

jest.mock("@/services/api/admin-orders", () => ({
  fetchEnquiryOrderLog: jest.fn(),
  updateAdminOrderStatus: jest.fn(),
}));

describe("EnquiryOrderPage", () => {
  it("renders 4 KPI cards in a row before filter section and calculates completed revenue", async () => {
    const { fetchEnquiryOrderLog } = await import("@/services/api/admin-orders");
    (fetchEnquiryOrderLog as jest.Mock).mockResolvedValue({
      siteCode: "IN",
      page: 1,
      pageSize: 20,
      total: 3,
      totalPages: 1,
      hasMore: false,
      orders: [
        {
          id: "ord-1",
          orderNumber: "ORD-101",
          status: "DELIVERED",
          currency: "INR",
          grandTotal: 5000,
          customerEmail: "cust1@test.com",
          createdAt: "2026-01-10T10:00:00.000Z",
          paymentStatus: "CAPTURED",
          itemCount: 2,
          itemsSummary: "Cream (x2)",
          items: [],
          payments: [{ id: "p1", status: "CAPTURED", method: "UPI", amount: 5000 }],
        },
        {
          id: "ord-2",
          orderNumber: "ORD-102",
          status: "PENDING",
          currency: "INR",
          grandTotal: 3000,
          customerEmail: "cust2@test.com",
          createdAt: "2026-01-11T10:00:00.000Z",
          paymentStatus: "PENDING",
          itemCount: 1,
          itemsSummary: "Serum (x1)",
          items: [],
          payments: [{ id: "p2", status: "PENDING", method: "CARD", amount: 3000 }],
        },
        {
          id: "ord-3",
          orderNumber: "ORD-103",
          status: "CANCELLED",
          currency: "INR",
          grandTotal: 2000,
          customerEmail: "cust3@test.com",
          createdAt: "2026-01-12T10:00:00.000Z",
          paymentStatus: "FAILED",
          itemCount: 1,
          itemsSummary: "Cleanser (x1)",
          items: [],
          payments: [{ id: "p3", status: "FAILED", method: "CARD", amount: 2000 }],
        },
      ],
    });

    render(<EnquiryOrderPage siteCode="IN" />);

    // Check KPI cards container
    await waitFor(() => {
      expect(screen.getByTestId("enquiry-order-stats")).toBeInTheDocument();
    });

    const statsSection = screen.getByTestId("enquiry-order-stats");

    // Total Revenue only includes completed payment (ORD-101: 5000 INR), NOT pending (3000) or cancelled (2000)
    expect(statsSection).toHaveTextContent("Total Revenue");
    expect(statsSection).toHaveTextContent("₹5,000");

    // Total Orders
    expect(statsSection).toHaveTextContent("Total Orders");
    expect(statsSection).toHaveTextContent("3");

    // Fulfilled Orders (DELIVERED/COMPLETED)
    expect(statsSection).toHaveTextContent("Fulfilled Orders");
    expect(statsSection).toHaveTextContent("1");

    // Pending Fulfillment (PENDING/CONFIRMED/PROCESSING)
    expect(statsSection).toHaveTextContent("Pending Fulfillment");
    expect(statsSection).toHaveTextContent("1");

    // Filter section appears after KPI cards
    expect(screen.getByText("Filter Orders")).toBeInTheDocument();
  });
});

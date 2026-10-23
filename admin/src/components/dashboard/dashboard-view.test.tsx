import { render, screen, waitFor } from "@testing-library/react";

import { DashboardView } from "@/components/dashboard/dashboard-view";

jest.mock("next/navigation", () => ({
  usePathname: () => "/admin/in/dashboard",
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { id: "1", email: "admin@skindx.test", role: "ADMIN", firstName: "Ada" },
    logout: jest.fn(),
  }),
}));

jest.mock("@/services/api/dashboard", () => ({
  fetchDashboard: jest.fn(),
}));

jest.mock("@/services/api/admin-orders", () => ({
  fetchVendorOrderLog: jest.fn().mockResolvedValue({ orders: [], total: 0 }),
}));

jest.mock("@/services/api/vendors", () => ({
  fetchVendorApplications: jest.fn().mockResolvedValue([]),
  fetchVendorCredentials: jest.fn().mockResolvedValue([]),
}));

describe("DashboardView", () => {
  it("shows an error state when the API fails", async () => {
    const { fetchDashboard } = await import("@/services/api/dashboard");
    const { ApiError } = await import("@/services/api/errors");
    (fetchDashboard as jest.Mock).mockRejectedValue(new ApiError("Forbidden", 403));

    render(<DashboardView siteCode="IN" />);

    expect(await screen.findByTestId("dashboard-error")).toHaveTextContent("Forbidden");
  });

  it("renders IN totals from API data and links to the online order log", async () => {
    const { fetchDashboard } = await import("@/services/api/dashboard");
    (fetchDashboard as jest.Mock).mockResolvedValue({
      siteCode: "IN",
      range: { from: "2026-01-01", to: "2026-01-31" },
      totals: {
        orders: 4,
        revenue: 2500,
        customers: 2,
        productsInStock: 8,
        lowStockAlerts: 1,
        pendingOrders: 1,
      },
      charts: {
        revenueOverTime: [],
        ordersByStatus: [],
        bestsellingProducts: [],
        orderActivityOverTime: [],
      },
      recentOrders: [
        {
          id: "o1",
          orderNumber: "IN-1",
          status: "CONFIRMED",
          grandTotal: 1000,
          taxTotal: 0,
          cgstTotal: 0,
          sgstTotal: 0,
          currency: "INR",
          createdAt: "2026-01-15T10:00:00.000Z",
          customerEmail: "a@example.com",
        },
      ],
    });

    render(<DashboardView siteCode="IN" />);

    await waitFor(() => {
      expect(screen.getByTestId("stat-cards")).toHaveTextContent("Total orders");
      expect(screen.getByTestId("stat-cards")).toHaveTextContent("4");
    });

    const viewAll = screen.getByRole("link", { name: /view all recent orders/i });
    expect(viewAll).toHaveAttribute("href", "/admin/in/orders/online-log");

    const vendorOrdersLink = screen.getByRole("link", { name: /vendor orders/i });
    expect(vendorOrdersLink).toHaveAttribute("href", "/admin/in/orders/vendor");

    expect(screen.getByTestId("vendor-dashboard-section")).toBeInTheDocument();
  });

  it("renders COM enquiry totals from API data", async () => {
    const { fetchDashboard } = await import("@/services/api/dashboard");
    (fetchDashboard as jest.Mock).mockResolvedValue({
      siteCode: "COM",
      range: { from: "2026-01-01", to: "2026-01-31" },
      totals: {
        enquiries: 12,
        newEnquiries: 3,
        awaitingResponse: 2,
      },
      charts: {
        enquiriesOverTime: [],
        enquiriesByStatus: [],
      },
      recentEnquiries: [],
    });

    render(<DashboardView siteCode="COM" />);

    await waitFor(() => {
      expect(screen.getByTestId("stat-cards")).toHaveTextContent("Total enquiries");
      expect(screen.getByTestId("stat-cards")).toHaveTextContent("12");
    });
  });
});

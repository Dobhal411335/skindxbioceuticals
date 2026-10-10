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

describe("DashboardView", () => {
  it("shows an error state when the API fails", async () => {
    const { fetchDashboard } = await import("@/services/api/dashboard");
    const { ApiError } = await import("@/services/api/errors");
    (fetchDashboard as jest.Mock).mockRejectedValue(new ApiError("Forbidden", 403));

    render(<DashboardView siteCode="IN" />);

    expect(await screen.findByTestId("dashboard-error")).toHaveTextContent("Forbidden");
  });

  it("renders IN totals from API data", async () => {
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
      recentOrders: [],
    });

    render(<DashboardView siteCode="IN" />);

    await waitFor(() => {
      expect(screen.getByTestId("stat-cards")).toHaveTextContent("Total orders");
      expect(screen.getByTestId("stat-cards")).toHaveTextContent("4");
    });
  });
});

import { render, screen } from "@testing-library/react";

import { AdminSidebar } from "@/components/layout/admin-sidebar";

jest.mock("next/navigation", () => ({
  usePathname: () => "/admin/in/dashboard",
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { id: "1", email: "admin@skindx.test", role: "ADMIN" },
    logout: jest.fn(),
  }),
}));

describe("AdminSidebar", () => {
  it("renders active dashboard navigation and planned markers", () => {
    render(
      <AdminSidebar siteCode="IN" collapsed={false} onCollapsedChange={jest.fn()} />,
    );

    expect(screen.getByTestId("nav-active-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("nav-planned-catalog-root")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-logout")).toBeInTheDocument();
  });
});

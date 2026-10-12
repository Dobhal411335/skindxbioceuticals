import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AdminSidebar } from "@/components/layout/admin-sidebar";

const logoutMock = jest.fn();
const replaceMock = jest.fn();
const showSuccessMock = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => "/admin/in/banners/top-advertisement",
  useRouter: () => ({ replace: replaceMock, push: jest.fn() }),
}));

jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: {
      id: "1",
      email: "admin@skindx.test",
      role: "SUPER_ADMIN",
      firstName: "Ada",
      lastName: "Admin",
    },
    logout: logoutMock,
  }),
}));

jest.mock("@/lib/toast", () => ({
  showSuccess: (...args: unknown[]) => showSuccessMock(...args),
  showError: jest.fn(),
}));

describe("AdminSidebar", () => {
  beforeEach(() => {
    logoutMock.mockReset();
    replaceMock.mockReset();
    showSuccessMock.mockReset();
    logoutMock.mockResolvedValue(undefined);
  });

  it("renders the same core modules for IN and COM", () => {
    const { unmount } = render(
      <AdminSidebar siteCode="IN" collapsed={false} onCollapsedChange={jest.fn()} />,
    );

    expect(screen.getByTestId("nav-active-dashboard")).toHaveTextContent("Dashboard Home");
    expect(screen.getByTestId("nav-active-company-info")).toBeInTheDocument();
    expect(screen.getByTestId("nav-group-manage-banners")).toBeInTheDocument();
    expect(screen.getByTestId("nav-group-sub-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-footer")).toHaveTextContent("User Logout");
    unmount();

    render(<AdminSidebar siteCode="COM" collapsed={false} onCollapsedChange={jest.fn()} />);

    expect(screen.getByTestId("nav-active-dashboard")).toHaveTextContent("Dashboard Home");
    expect(screen.getByTestId("nav-active-company-info")).toBeInTheDocument();
    expect(screen.getByTestId("nav-group-manage-banners")).toBeInTheDocument();
    expect(screen.getByTestId("nav-group-sub-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("nav-group-create-product")).toBeInTheDocument();
  });

  it("expands the active banner parent", () => {
    render(
      <AdminSidebar siteCode="IN" collapsed={false} onCollapsedChange={jest.fn()} />,
    );

    expect(screen.getByTestId("nav-group-manage-banners")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByTestId("nav-active-banner-top-advertisement")).toBeInTheDocument();
    expect(screen.getByTestId("nav-active-banner-about-us")).toBeInTheDocument();
    expect(screen.queryByText(/profile \/ account/i)).not.toBeInTheDocument();
  });

  it("logs out with a success toast", async () => {
    const user = userEvent.setup();
    render(
      <AdminSidebar siteCode="IN" collapsed={false} onCollapsedChange={jest.fn()} />,
    );

    await user.click(screen.getByTestId("sidebar-logout"));

    expect(logoutMock).toHaveBeenCalled();
    expect(showSuccessMock).toHaveBeenCalledWith(
      "Signed out successfully.",
      expect.objectContaining({ id: "admin.auth.logout.success" }),
    );
    expect(replaceMock).toHaveBeenCalledWith("/login");
  });

  it("toggles accordion sections", async () => {
    const user = userEvent.setup();
    render(
      <AdminSidebar siteCode="COM" collapsed={false} onCollapsedChange={jest.fn()} />,
    );

    const group = screen.getByTestId("nav-group-create-product");
    expect(group).toHaveAttribute("aria-expanded", "false");
    await user.click(group);
    expect(group).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("nav-active-manage-products-category")).toBeInTheDocument();
    expect(screen.getByTestId("nav-active-create-category")).toBeInTheDocument();
  });
});

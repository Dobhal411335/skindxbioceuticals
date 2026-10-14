import { configureStore } from "@reduxjs/toolkit";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";

import { AccountSidebar } from "@/components/account/account-sidebar";
import authReducer, { setCredentials } from "@/store/slices/authSlice";

const pushMock = jest.fn();
const logoutMock = jest.fn();
const showSuccessMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: jest.fn() }),
  usePathname: () => "/account/orders",
}));

jest.mock("@/features/auth/auth.service", () => ({
  authService: {
    logout: (...args: unknown[]) => logoutMock(...args),
  },
}));

jest.mock("@/lib/toast", () => ({
  showSuccess: (...args: unknown[]) => showSuccessMock(...args),
  showError: jest.fn(),
  showInfo: jest.fn(),
  showWarning: jest.fn(),
}));

function renderSidebar() {
  const store = configureStore({
    reducer: { auth: authReducer },
  });
  store.dispatch(
    setCredentials({
      user: {
        id: "1",
        email: "ada@skindx.test",
        firstName: "Ada",
        lastName: "Lovelace",
        hasPassword: true,
        linkedProviders: [],
      },
      accessToken: "token",
    }),
  );

  return render(
    <Provider store={store}>
      <AccountSidebar />
    </Provider>,
  );
}

describe("AccountSidebar", () => {
  beforeEach(() => {
    pushMock.mockReset();
    logoutMock.mockReset();
    showSuccessMock.mockReset();
    logoutMock.mockResolvedValue({ serverRevoked: true });
  });

  it("highlights the active route and shows profile header", () => {
    renderSidebar();

    expect(screen.getAllByText("Ada Lovelace").length).toBeGreaterThan(0);
    const ordersLinks = screen.getAllByRole("link", { name: /your orders/i });
    expect(ordersLinks[0]).toHaveAttribute("aria-current", "page");
  });

  it("toasts success after logout from the portal sidebar", async () => {
    const user = userEvent.setup();
    renderSidebar();

    await user.click(screen.getAllByRole("button", { name: /log out/i })[0]!);

    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalled();
      expect(showSuccessMock).toHaveBeenCalledWith(
        "Logged out successfully.",
        expect.objectContaining({ id: "auth.logout.success" }),
      );
      expect(pushMock).toHaveBeenCalledWith("/");
    });
  });
});

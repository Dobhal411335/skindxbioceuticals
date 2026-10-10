import { configureStore } from "@reduxjs/toolkit";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";

import { AccountSidebar } from "@/components/account/account-sidebar";
import authReducer, { setCredentials } from "@/store/slices/authSlice";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/account/orders",
}));

jest.mock("@/features/auth/auth.service", () => ({
  authService: {
    logout: jest.fn(),
  },
}));

describe("AccountSidebar", () => {
  it("highlights the active route and shows profile header", () => {
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

    render(
      <Provider store={store}>
        <AccountSidebar />
      </Provider>,
    );

    expect(screen.getAllByText("Ada Lovelace").length).toBeGreaterThan(0);
    const ordersLinks = screen.getAllByRole("link", { name: /your orders/i });
    expect(ordersLinks[0]).toHaveAttribute("aria-current", "page");
  });
});

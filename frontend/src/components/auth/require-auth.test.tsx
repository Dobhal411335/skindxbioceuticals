import { configureStore } from "@reduxjs/toolkit";
import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";

import { RequireAuth } from "@/components/auth/require-auth";
import authReducer, { setCredentials } from "@/store/slices/authSlice";

const replaceMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: jest.fn() }),
  usePathname: () => "/account/dashboard",
}));

function renderGuard(authenticated: boolean) {
  const store = configureStore({
    reducer: { auth: authReducer },
  });

  if (authenticated) {
    store.dispatch(
      setCredentials({
        user: {
          id: "1",
          email: "ada@skindx.test",
          firstName: "Ada",
          hasPassword: true,
          linkedProviders: [],
        },
        accessToken: "token",
      }),
    );
  } else {
    store.dispatch({ type: "auth/clearCredentials" });
  }

  return render(
    <Provider store={store}>
      <RequireAuth>
        <div>Protected content</div>
      </RequireAuth>
    </Provider>,
  );
}

describe("RequireAuth", () => {
  beforeEach(() => {
    replaceMock.mockReset();
  });

  it("redirects unauthenticated users to login with safe redirect", async () => {
    renderGuard(false);
    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        "/account/login?redirect=%2Faccount%2Fdashboard",
      );
    });
  });

  it("renders children when authenticated", () => {
    renderGuard(true);
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });
});

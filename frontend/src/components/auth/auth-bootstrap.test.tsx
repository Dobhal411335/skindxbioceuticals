import { configureStore } from "@reduxjs/toolkit";
import { render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";

import { AuthBootstrap } from "@/components/auth/auth-bootstrap";
import authReducer from "@/store/slices/authSlice";

const refreshSessionMock = jest.fn();
const meMock = jest.fn();
const getAccessTokenMock = jest.fn();

jest.mock("@/features/auth/auth.service", () => ({
  authService: {
    refreshSession: (...args: unknown[]) => refreshSessionMock(...args),
    me: (...args: unknown[]) => meMock(...args),
  },
}));

jest.mock("@/services/api/token-store", () => ({
  tokenStore: {
    getAccessToken: () => getAccessTokenMock(),
    setAccessToken: jest.fn(),
    clear: jest.fn(),
  },
}));

function renderBootstrap() {
  const store = configureStore({
    reducer: { auth: authReducer },
  });

  render(
    <Provider store={store}>
      <AuthBootstrap />
    </Provider>,
  );

  return store;
}

describe("AuthBootstrap", () => {
  beforeEach(() => {
    refreshSessionMock.mockReset();
    meMock.mockReset();
    getAccessTokenMock.mockReset();
    getAccessTokenMock.mockReturnValue(null);
  });

  it("settles to unauthenticated for guests instead of staying on loading", async () => {
    refreshSessionMock.mockResolvedValue(null);

    const store = renderBootstrap();

    await waitFor(() => {
      expect(store.getState().auth.status).toBe("unauthenticated");
    });
    expect(store.getState().auth.user).toBeNull();
  });

  it("restores credentials when refresh succeeds", async () => {
    refreshSessionMock.mockResolvedValue({
      accessToken: "access-token",
      user: {
        id: "1",
        email: "ada@skindx.test",
        firstName: "Ada",
        hasPassword: true,
        linkedProviders: [],
      },
    });

    const store = renderBootstrap();

    await waitFor(() => {
      expect(store.getState().auth.status).toBe("authenticated");
    });
    expect(store.getState().auth.user?.email).toBe("ada@skindx.test");
  });
});

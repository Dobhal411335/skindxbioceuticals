import { configureStore } from "@reduxjs/toolkit";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";

import { HeaderAccountMenu } from "@/components/layout/header-account-menu";
import authReducer, {
  clearCredentials,
  setAuthStatus,
  setCredentials,
} from "@/store/slices/authSlice";
import type { AuthUser } from "@/types/auth";

const pushMock = jest.fn();
const logoutMock = jest.fn();
const showSuccessMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: jest.fn() }),
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

function renderMenu(user?: AuthUser | null, status: "idle" | "loading" | "authenticated" | "unauthenticated" = "unauthenticated") {
  const store = configureStore({
    reducer: { auth: authReducer },
  });

  if (user && status === "authenticated") {
    store.dispatch(
      setCredentials({
        user,
        accessToken: "token",
      }),
    );
  } else if (status === "loading" || status === "idle") {
    store.dispatch(setAuthStatus(status));
  } else {
    store.dispatch(clearCredentials());
  }

  return render(
    <Provider store={store}>
      <HeaderAccountMenu />
    </Provider>,
  );
}

const passwordUser: AuthUser = {
  id: "1",
  email: "ada@skindx.test",
  firstName: "Ada",
  lastName: "Lovelace",
  imageUrl: null,
  hasPassword: true,
  linkedProviders: [],
};

const googleUser: AuthUser = {
  id: "2",
  email: "gita@skindx.test",
  firstName: "Gita",
  lastName: null,
  imageUrl: "https://example.com/avatar.png",
  hasPassword: false,
  linkedProviders: ["GOOGLE"],
};

describe("HeaderAccountMenu", () => {
  beforeEach(() => {
    pushMock.mockReset();
    logoutMock.mockReset();
    showSuccessMock.mockReset();
    logoutMock.mockResolvedValue({ serverRevoked: true });
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
    });
  });

  it("shows login control when logged out", () => {
    renderMenu(null, "unauthenticated");
    expect(screen.getByRole("link", { name: /login or account/i })).toHaveAttribute(
      "href",
      "/account/login",
    );
  });

  it("shows loading skeleton while auth bootstraps", () => {
    renderMenu(null, "loading");
    expect(screen.getByLabelText(/loading account/i)).toBeInTheDocument();
  });

  it("marks avatar as having a Google profile image URL when valid", () => {
    renderMenu(googleUser, "authenticated");
    const trigger = screen.getByRole("button", { name: /open account menu/i });
    // Radix AvatarImage may not mount the <img> until load succeeds in jsdom.
    expect(trigger.querySelector('[data-has-image="true"]')).toBeInTheDocument();
  });

  it("falls back to initial when image is missing", () => {
    renderMenu(passwordUser, "authenticated");
    const trigger = screen.getByRole("button", { name: /open account menu/i });
    expect(trigger.querySelector('[data-has-image="false"]')).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("opens menu with dashboard and logout actions", async () => {
    const user = userEvent.setup();
    renderMenu(passwordUser, "authenticated");
    await user.click(screen.getByRole("button", { name: /open account menu/i }));
    const dashboard = await screen.findByRole("menuitem", { name: /dashboard/i });
    expect(dashboard).toHaveAttribute("href", "/account/dashboard");
    expect(screen.getByRole("menuitem", { name: /log out/i })).toBeInTheDocument();
  });

  it("logs out, clears session, toasts success, and redirects home", async () => {
    const user = userEvent.setup();
    renderMenu(passwordUser, "authenticated");
    await user.click(screen.getByRole("button", { name: /open account menu/i }));
    await user.click(await screen.findByRole("menuitem", { name: /log out/i }));
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

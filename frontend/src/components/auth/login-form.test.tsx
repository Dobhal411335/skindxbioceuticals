import { configureStore } from "@reduxjs/toolkit";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import authReducer from "@/store/slices/authSlice";

const loginMock = jest.fn();
const replaceMock = jest.fn();
const pushMock = jest.fn();
const showSuccessMock = jest.fn();
const showErrorMock = jest.fn();
const showInfoMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/features/auth/auth.service", () => ({
  authService: {
    login: (...args: unknown[]) => loginMock(...args),
  },
}));

jest.mock("@/lib/toast", () => ({
  showSuccess: (...args: unknown[]) => showSuccessMock(...args),
  showError: (...args: unknown[]) => showErrorMock(...args),
  showInfo: (...args: unknown[]) => showInfoMock(...args),
  showWarning: jest.fn(),
}));

jest.mock("@/components/auth/google-sign-in-button", () => ({
  GoogleSignInButton: () => <div data-testid="google-sign-in-stub" />,
}));

function renderForm() {
  const store = configureStore({ reducer: { auth: authReducer } });
  return render(
    <Provider store={store}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </Provider>,
  );
}

describe("LoginForm toasts", () => {
  beforeEach(() => {
    loginMock.mockReset();
    replaceMock.mockReset();
    pushMock.mockReset();
    showSuccessMock.mockReset();
    showErrorMock.mockReset();
    showInfoMock.mockReset();
  });

  it("toasts success only after backend login succeeds", async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue({
      accessToken: "token",
      user: { id: "1", email: "a@example.com", role: "CUSTOMER" },
    });
    renderForm();

    await user.type(screen.getByLabelText(/email address/i), "a@example.com");
    await user.type(screen.getByLabelText(/^password/i), "StrongPass1!xx");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(showSuccessMock).toHaveBeenCalledWith(
        "Signed in successfully.",
        expect.objectContaining({ id: "auth.login.success" }),
      );
    });
  });

  it("toasts a safe error on invalid credentials and never success", async () => {
    const user = userEvent.setup();
    loginMock.mockRejectedValue({
      message: "Invalid email or password.",
      statusCode: 401,
      code: null,
      details: null,
    });
    renderForm();

    await user.type(screen.getByLabelText(/email address/i), "a@example.com");
    await user.type(screen.getByLabelText(/^password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(showErrorMock).toHaveBeenCalledWith(
        "Invalid email or password.",
        expect.objectContaining({ id: "auth.login.error" }),
      );
    });
    expect(showSuccessMock).not.toHaveBeenCalled();
  });

  it("toasts info and redirects when email is unverified", async () => {
    const user = userEvent.setup();
    loginMock.mockRejectedValue({
      message: "Email not verified",
      statusCode: 403,
      code: null,
      details: { code: "EMAIL_NOT_VERIFIED", email: "a@example.com" },
    });
    renderForm();

    await user.type(screen.getByLabelText(/email address/i), "a@example.com");
    await user.type(screen.getByLabelText(/^password/i), "StrongPass1!xx");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(showInfoMock).toHaveBeenCalledWith(
        "Please verify your email to continue.",
        expect.objectContaining({ id: "auth.login.unverified" }),
      );
      expect(pushMock).toHaveBeenCalledWith(
        "/account/verify-email?email=a%40example.com",
      );
    });
    expect(showSuccessMock).not.toHaveBeenCalled();
  });
});

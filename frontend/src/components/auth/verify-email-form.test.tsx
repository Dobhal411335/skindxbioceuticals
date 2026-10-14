import { configureStore } from "@reduxjs/toolkit";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { Suspense } from "react";

import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import authReducer, {
  clearCredentials,
  setCredentials,
} from "@/store/slices/authSlice";
import type { AuthUser } from "@/types/auth";

const verifyMock = jest.fn();
const resendMock = jest.fn();
const replaceMock = jest.fn();
const showSuccessMock = jest.fn();
const showErrorMock = jest.fn();
const showInfoMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: jest.fn() }),
  useSearchParams: () =>
    new URLSearchParams("email=a%40example.com&from=signup"),
}));

jest.mock("@/features/auth/auth.service", () => ({
  authService: {
    verifyEmail: (...args: unknown[]) => verifyMock(...args),
    resendVerification: (...args: unknown[]) => resendMock(...args),
  },
}));

jest.mock("@/lib/toast", () => ({
  showSuccess: (...args: unknown[]) => showSuccessMock(...args),
  showError: (...args: unknown[]) => showErrorMock(...args),
  showInfo: (...args: unknown[]) => showInfoMock(...args),
  showWarning: jest.fn(),
}));

function renderForm(options?: { authenticatedUser?: AuthUser }) {
  const store = configureStore({ reducer: { auth: authReducer } });
  if (options?.authenticatedUser) {
    store.dispatch(
      setCredentials({
        user: options.authenticatedUser,
        accessToken: "token",
      }),
    );
  } else {
    store.dispatch(clearCredentials());
  }
  return render(
    <Provider store={store}>
      <Suspense>
        <VerifyEmailForm />
      </Suspense>
    </Provider>,
  );
}

describe("VerifyEmailForm toasts", () => {
  beforeEach(() => {
    verifyMock.mockReset();
    resendMock.mockReset();
    replaceMock.mockReset();
    showSuccessMock.mockReset();
    showErrorMock.mockReset();
    showInfoMock.mockReset();
    // input-otp password-manager badge probes this; jsdom does not implement it.
    document.elementFromPoint = jest.fn(() => null);
  });

  it("shows welcome toast and panel only after verification succeeds", async () => {
    const user = userEvent.setup();
    verifyMock.mockResolvedValue({
      accessToken: "token",
      user: {
        id: "1",
        email: "a@example.com",
        role: "CUSTOMER",
        firstName: "Ada",
      },
    });
    renderForm();

    await user.type(screen.getByLabelText(/verification code/i), "123456");
    await user.click(screen.getByRole("button", { name: /verify email/i }));

    await waitFor(() => {
      expect(showSuccessMock).toHaveBeenCalledWith(
        "Welcome to SkinDx Bioceuticals!",
        expect.objectContaining({ id: "auth.verify.success" }),
      );
    });

    expect(
      screen.getByRole("heading", {
        name: /welcome to skindx bioceuticals, ada/i,
      }),
    ).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /continue shopping/i }));
    expect(replaceMock).toHaveBeenCalledWith("/");
  });

  it("toasts an error for invalid OTP and never success", async () => {
    const user = userEvent.setup();
    verifyMock.mockRejectedValue({
      message: "Invalid or expired verification code.",
      statusCode: 400,
      code: null,
      details: null,
    });
    renderForm();

    await user.type(screen.getByLabelText(/verification code/i), "000000");
    await user.click(screen.getByRole("button", { name: /verify email/i }));

    await waitFor(() => {
      expect(showErrorMock).toHaveBeenCalled();
    });
    expect(showSuccessMock).not.toHaveBeenCalled();
  });

  it("toasts info only after resend is confirmed by the backend", async () => {
    const user = userEvent.setup();
    resendMock.mockResolvedValue(undefined);
    renderForm();

    await user.click(screen.getByRole("button", { name: /resend verification code/i }));

    await waitFor(() => {
      expect(resendMock).toHaveBeenCalledWith({ email: "a@example.com" });
      expect(showInfoMock).toHaveBeenCalledWith(
        expect.stringMatching(/new code has been sent/i),
        expect.objectContaining({ id: "auth.verify.resend.success" }),
      );
    });
  });

  it("shows welcome panel for an already-authenticated session after refresh", () => {
    renderForm({
      authenticatedUser: {
        id: "1",
        email: "a@example.com",
        role: "CUSTOMER",
        firstName: "Ada",
      },
    });

    expect(
      screen.getByRole("heading", {
        name: /welcome to skindx bioceuticals, ada/i,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/verification code/i)).not.toBeInTheDocument();
  });
});

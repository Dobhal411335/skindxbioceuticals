import { configureStore } from "@reduxjs/toolkit";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { Suspense } from "react";

import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import authReducer from "@/store/slices/authSlice";

const verifyMock = jest.fn();
const resendMock = jest.fn();
const replaceMock = jest.fn();
const showSuccessMock = jest.fn();
const showErrorMock = jest.fn();
const showInfoMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: jest.fn() }),
  useSearchParams: () => new URLSearchParams("email=a%40example.com"),
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

function renderForm() {
  const store = configureStore({ reducer: { auth: authReducer } });
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
  });

  it("toasts success only after verification succeeds", async () => {
    const user = userEvent.setup();
    verifyMock.mockResolvedValue({
      accessToken: "token",
      user: { id: "1", email: "a@example.com", role: "CUSTOMER" },
    });
    renderForm();

    await user.type(screen.getByLabelText(/verification code/i), "123456");
    await user.click(screen.getByRole("button", { name: /verify email/i }));

    await waitFor(() => {
      expect(showSuccessMock).toHaveBeenCalledWith(
        "Email verified successfully.",
        expect.objectContaining({ id: "auth.verify.success" }),
      );
    });
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
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Suspense } from "react";

import { SignupForm } from "@/components/auth/signup-form";

const registerMock = jest.fn();
const pushMock = jest.fn();
const showInfoMock = jest.fn();
const showErrorMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: jest.fn() }),
}));

jest.mock("@/features/auth/auth.service", () => ({
  authService: {
    register: (...args: unknown[]) => registerMock(...args),
  },
}));

jest.mock("@/lib/toast", () => ({
  showSuccess: jest.fn(),
  showError: (...args: unknown[]) => showErrorMock(...args),
  showInfo: (...args: unknown[]) => showInfoMock(...args),
  showWarning: jest.fn(),
}));

jest.mock("@/components/auth/google-sign-in-button", () => ({
  GoogleSignInButton: () => <div data-testid="google-sign-in-stub" />,
}));

describe("SignupForm toasts", () => {
  beforeEach(() => {
    registerMock.mockReset();
    pushMock.mockReset();
    showInfoMock.mockReset();
    showErrorMock.mockReset();
  });

  it("toasts verification guidance only after register succeeds", async () => {
    const user = userEvent.setup();
    registerMock.mockResolvedValue({ email: "new@example.com" });
    render(
      <Suspense>
        <SignupForm />
      </Suspense>,
    );

    await user.type(screen.getByLabelText(/full name/i), "Ada Lovelace");
    await user.type(screen.getByLabelText(/email address/i), "new@example.com");
    await user.type(document.getElementById("signup-password")!, "StrongPass1!xx");
    await user.type(document.getElementById("signup-confirm-password")!, "StrongPass1!xx");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /^sign up$/i }));

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalled();
      expect(showInfoMock).toHaveBeenCalledWith(
        "Check your email for a verification code.",
        expect.objectContaining({ id: "auth.signup.success" }),
      );
      expect(pushMock).toHaveBeenCalledWith(
        "/account/verify-email?email=new%40example.com",
      );
    });
  });

  it("toasts an error and never success info when register fails", async () => {
    const user = userEvent.setup();
    registerMock.mockRejectedValue({
      message: "An account with this email already exists.",
      statusCode: 409,
      code: null,
      details: null,
    });
    render(
      <Suspense>
        <SignupForm />
      </Suspense>,
    );

    await user.type(screen.getByLabelText(/full name/i), "Ada Lovelace");
    await user.type(screen.getByLabelText(/email address/i), "new@example.com");
    await user.type(document.getElementById("signup-password")!, "StrongPass1!xx");
    await user.type(document.getElementById("signup-confirm-password")!, "StrongPass1!xx");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /^sign up$/i }));

    await waitFor(() => {
      expect(showErrorMock).toHaveBeenCalled();
    });
    expect(showInfoMock).not.toHaveBeenCalled();
  });
});

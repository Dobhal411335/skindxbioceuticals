import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LoginForm } from "@/components/auth/login-form";

const loginMock = jest.fn();
const replaceMock = jest.fn();
const showSuccessMock = jest.fn();
const showErrorMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: jest.fn() }),
}));

jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    login: loginMock,
  }),
}));

jest.mock("@/lib/toast", () => ({
  showSuccess: (...args: unknown[]) => showSuccessMock(...args),
  showError: (...args: unknown[]) => showErrorMock(...args),
  showInfo: jest.fn(),
  showWarning: jest.fn(),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    loginMock.mockReset();
    replaceMock.mockReset();
    showSuccessMock.mockReset();
    showErrorMock.mockReset();
  });

  it("shows validation errors for empty fields", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByTestId("email-error")).toBeInTheDocument();
    expect(screen.getByTestId("password-error")).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
    expect(showSuccessMock).not.toHaveBeenCalled();
  });

  it("submits valid credentials, toasts success, and navigates to select-site", async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue(undefined);
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "admin@skindx.test");
    await user.type(screen.getByLabelText(/^password$/i), "StrongPass1!xx");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith("admin@skindx.test", "StrongPass1!xx");
      expect(showSuccessMock).toHaveBeenCalledWith(
        "Signed in successfully.",
        expect.objectContaining({ id: "admin.auth.login.success" }),
      );
      expect(replaceMock).toHaveBeenCalledWith("/select-site");
    });
  });

  it("shows an error toast when login fails and never toasts success", async () => {
    const user = userEvent.setup();
    const { ApiError } = await import("@/services/api/errors");
    loginMock.mockRejectedValue(new ApiError("Invalid email or password", 401));
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "admin@skindx.test");
    await user.type(screen.getByLabelText(/^password$/i), "wrong");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(showErrorMock).toHaveBeenCalledWith(
        "Invalid email or password",
        expect.objectContaining({ id: "admin.auth.login.error" }),
      );
    });
    expect(showSuccessMock).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("toggles password visibility and does not advertise forgot-password", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    expect(screen.queryByRole("link", { name: /forgot password/i })).not.toBeInTheDocument();
    const password = screen.getByLabelText(/^password$/i);
    expect(password).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: /show password/i }));
    expect(password).toHaveAttribute("type", "text");
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LoginForm } from "@/components/auth/login-form";

const loginMock = jest.fn();
const replaceMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: jest.fn() }),
}));

jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    login: loginMock,
  }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    loginMock.mockReset();
    replaceMock.mockReset();
  });

  it("shows validation errors for empty fields", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByTestId("email-error")).toBeInTheDocument();
    expect(screen.getByTestId("password-error")).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("submits valid credentials and navigates to select-site", async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue(undefined);
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "admin@skindx.test");
    await user.type(screen.getByLabelText(/^password$/i), "StrongPass1!xx");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith("admin@skindx.test", "StrongPass1!xx");
      expect(replaceMock).toHaveBeenCalledWith("/select-site");
    });
  });

  it("shows an API error message when login fails", async () => {
    const user = userEvent.setup();
    const { ApiError } = await import("@/services/api/errors");
    loginMock.mockRejectedValue(new ApiError("Invalid email or password", 401));
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "admin@skindx.test");
    await user.type(screen.getByLabelText(/^password$/i), "wrong");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByTestId("login-error")).toHaveTextContent(
      "Invalid email or password",
    );
  });
});

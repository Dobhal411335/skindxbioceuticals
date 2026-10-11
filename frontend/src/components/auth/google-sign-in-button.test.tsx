import { configureStore } from "@reduxjs/toolkit";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import authReducer from "@/store/slices/authSlice";

const replaceMock = jest.fn();
const signInWithGoogleMock = jest.fn();
const showErrorMock = jest.fn();
const showSuccessMock = jest.fn();
let googleOnSuccess: ((response: { credential?: string }) => void) | undefined;
let googleOnError: (() => void) | undefined;

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: jest.fn() }),
  useSearchParams: () => new URLSearchParams("redirect=/shop"),
}));

jest.mock("@/features/auth/auth.service", () => ({
  authService: {
    signInWithGoogle: (...args: unknown[]) => signInWithGoogleMock(...args),
  },
}));

jest.mock("@/lib/toast", () => ({
  showError: (...args: unknown[]) => showErrorMock(...args),
  showSuccess: (...args: unknown[]) => showSuccessMock(...args),
  showInfo: jest.fn(),
  showWarning: jest.fn(),
}));

jest.mock("@react-oauth/google", () => ({
  GoogleLogin: (props: {
    onSuccess: (response: { credential?: string }) => void;
    onError: () => void;
  }) => {
    googleOnSuccess = props.onSuccess;
    googleOnError = props.onError;
    return (
      <button type="button" onClick={() => props.onSuccess({ credential: "google-id-token" })}>
        Continue with Google
      </button>
    );
  },
}));

function renderButton() {
  const store = configureStore({
    reducer: { auth: authReducer },
  });

  return render(
    <Provider store={store}>
      <GoogleSignInButton />
    </Provider>,
  );
}

describe("GoogleSignInButton", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    signInWithGoogleMock.mockReset();
    showErrorMock.mockReset();
    showSuccessMock.mockReset();
    googleOnSuccess = undefined;
    googleOnError = undefined;
  });

  it("renders the Google button", () => {
    renderButton();
    expect(screen.getByTestId("google-sign-in")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
  });

  it("shows a loading state while the backend authenticates", async () => {
    const user = userEvent.setup();
    let resolveSignIn: (value: unknown) => void = () => undefined;
    signInWithGoogleMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignIn = resolve;
        }),
    );

    renderButton();
    await user.click(screen.getByRole("button", { name: /continue with google/i }));

    expect(await screen.findByTestId("google-loading")).toBeInTheDocument();

    resolveSignIn({
      accessToken: "access-token",
      user: { id: "1", email: "a@example.com", role: "CUSTOMER" },
    });

    await waitFor(() => {
      expect(screen.queryByTestId("google-loading")).not.toBeInTheDocument();
    });
  });

  it("toasts a cancellation/error message when Google fails", () => {
    renderButton();
    googleOnError?.();
    expect(showErrorMock).toHaveBeenCalledWith(
      expect.stringMatching(/cancelled or failed/i),
      expect.objectContaining({ id: "auth.google.error" }),
    );
    expect(screen.queryByTestId("google-error")).not.toBeInTheDocument();
  });

  it("shows a backend conflict message for an existing email", async () => {
    const user = userEvent.setup();
    signInWithGoogleMock.mockRejectedValue({
      message:
        "An account with this email already exists. Sign in with your password, then link Google from account settings.",
      statusCode: 409,
      code: null,
      details: null,
    });

    renderButton();
    await user.click(screen.getByRole("button", { name: /continue with google/i }));

    const alert = await screen.findByTestId("google-error");
    expect(alert).toHaveTextContent(/account already exists/i);
    expect(alert).toHaveTextContent(/sign in with your password/i);
  });

  it("stores credentials and redirects safely after backend success", async () => {
    const user = userEvent.setup();
    signInWithGoogleMock.mockResolvedValue({
      accessToken: "access-token",
      user: { id: "1", email: "a@example.com", role: "CUSTOMER" },
    });

    renderButton();
    await user.click(screen.getByRole("button", { name: /continue with google/i }));

    await waitFor(() => {
      expect(signInWithGoogleMock).toHaveBeenCalledWith("google-id-token");
      expect(showSuccessMock).toHaveBeenCalledWith(
        "Signed in with Google.",
        expect.objectContaining({ id: "auth.google.success" }),
      );
      expect(replaceMock).toHaveBeenCalledWith("/shop");
    });
  });

  it("toasts backend failures that are not account conflicts", async () => {
    const user = userEvent.setup();
    signInWithGoogleMock.mockRejectedValue({
      message: "Unable to sign in with Google. Please try again.",
      statusCode: 500,
      code: null,
      details: null,
    });

    renderButton();
    await user.click(screen.getByRole("button", { name: /continue with google/i }));

    await waitFor(() => {
      expect(showErrorMock).toHaveBeenCalledWith(
        expect.stringMatching(/unable to sign in with google/i),
        expect.objectContaining({ id: "auth.google.error" }),
      );
    });
    expect(showSuccessMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("google-error")).not.toBeInTheDocument();
  });
});

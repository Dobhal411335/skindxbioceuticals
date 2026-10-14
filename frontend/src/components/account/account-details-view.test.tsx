import { configureStore } from "@reduxjs/toolkit";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";

import { AccountDetailsView } from "@/components/account/account-details-view";
import authReducer, { setCredentials } from "@/store/slices/authSlice";
import type { AuthUser } from "@/types/auth";

const uploadAvatarMock = jest.fn();
const clearAvatarMock = jest.fn();
const showSuccessMock = jest.fn();
const showErrorMock = jest.fn();

jest.mock("@/features/me/me.service", () => ({
  meService: {
    updateProfile: jest.fn(),
    uploadAvatar: (...args: unknown[]) => uploadAvatarMock(...args),
    clearAvatar: (...args: unknown[]) => clearAvatarMock(...args),
  },
}));

jest.mock("@/lib/toast", () => ({
  showSuccess: (...args: unknown[]) => showSuccessMock(...args),
  showError: (...args: unknown[]) => showErrorMock(...args),
  showInfo: jest.fn(),
  showWarning: jest.fn(),
}));

function renderDetails(user: AuthUser) {
  const store = configureStore({
    reducer: { auth: authReducer },
  });
  store.dispatch(setCredentials({ user, accessToken: "token" }));
  return render(
    <Provider store={store}>
      <AccountDetailsView />
    </Provider>,
  );
}

describe("AccountDetailsView password visibility", () => {
  beforeEach(() => {
    uploadAvatarMock.mockReset();
    clearAvatarMock.mockReset();
    showSuccessMock.mockReset();
    showErrorMock.mockReset();
  });

  it("shows current password field for password accounts", () => {
    renderDetails({
      id: "1",
      email: "ada@skindx.test",
      firstName: "Ada",
      hasPassword: true,
      linkedProviders: [],
    });
    expect(document.getElementById("currentPassword")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /update password/i })).toBeInTheDocument();
  });

  it("hides current password for Google-only accounts and offers set password", () => {
    renderDetails({
      id: "2",
      email: "gita@skindx.test",
      firstName: "Gita",
      hasPassword: false,
      linkedProviders: ["GOOGLE"],
    });
    expect(document.getElementById("currentPassword")).toBeNull();
    expect(screen.getByText(/signs in with google/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /set password/i })).toBeInTheDocument();
  });

  it("uploads a profile photo and toasts success", async () => {
    const user = userEvent.setup();
    uploadAvatarMock.mockResolvedValue({
      user: {
        id: "1",
        email: "ada@skindx.test",
        firstName: "Ada",
        imageUrl: "https://cdn.example.com/new.jpg",
        hasPassword: true,
        linkedProviders: [],
      },
    });
    renderDetails({
      id: "1",
      email: "ada@skindx.test",
      firstName: "Ada",
      hasPassword: true,
      linkedProviders: [],
    });

    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(uploadAvatarMock).toHaveBeenCalled();
      expect(showSuccessMock).toHaveBeenCalledWith(
        "Profile photo updated.",
        expect.objectContaining({ id: "account.avatar.success" }),
      );
    });
  });
});

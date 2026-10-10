import { configureStore } from "@reduxjs/toolkit";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";

import { AccountDetailsView } from "@/components/account/account-details-view";
import authReducer, { setCredentials } from "@/store/slices/authSlice";
import type { AuthUser } from "@/types/auth";

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
});

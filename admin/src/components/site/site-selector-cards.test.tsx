import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SiteSelectorCards } from "@/components/site/site-selector-cards";
import type { AuthSite } from "@/types/auth";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: jest.fn() }),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: { alt: string }) => <img alt={props.alt} />,
}));

const inSite: AuthSite = {
  id: "1",
  code: "IN",
  name: "India",
  role: "ADMIN",
};

describe("SiteSelectorCards", () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  it("enables only authorized sites", async () => {
    const user = userEvent.setup();
    render(<SiteSelectorCards sites={[inSite]} />);

    expect(screen.getByTestId("site-card-IN")).toHaveAttribute("data-authorized", "true");
    expect(screen.getByTestId("site-card-COM")).toHaveAttribute("data-authorized", "false");

    await user.click(screen.getByRole("button", { name: /manage india website/i }));
    expect(pushMock).toHaveBeenCalledWith("/admin/in/dashboard");

    expect(screen.queryByRole("button", { name: /manage global website/i })).not.toBeInTheDocument();
  });
});

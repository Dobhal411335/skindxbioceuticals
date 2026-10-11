import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AboutUsBannerPage } from "@/components/about-us-banner/about-us-banner-page";

const fetchMock = jest.fn();
const upsertMock = jest.fn();
const showSuccessMock = jest.fn();
const showErrorMock = jest.fn();

jest.mock("@/services/api/about-us-banner", () => ({
  fetchAboutUsBannerConfig: (...args: unknown[]) => fetchMock(...args),
  upsertAboutUsBannerConfig: (...args: unknown[]) => upsertMock(...args),
  uploadAboutUsImage: jest.fn(),
}));

jest.mock("@/lib/toast", () => ({
  showSuccess: (...args: unknown[]) => showSuccessMock(...args),
  showError: (...args: unknown[]) => showErrorMock(...args),
  showInfo: jest.fn(),
  showWarning: jest.fn(),
}));

jest.mock("@/components/layout/admin-app-shell", () => ({
  AdminAppShell: ({
    children,
    title,
  }: {
    children: React.ReactNode;
    title: string;
  }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

const sampleDto = {
  id: "11111111-1111-4111-8111-111111111111",
  siteCode: "IN" as const,
  promoLabel: "Featured offers",
  promoHeading: "Curated selections",
  promoSubheading: "While stocks last",
  promoButtonLabel: "Shop now",
  promoButtonUrl: "/shop",
  aboutCards: [],
  highlightItems: [],
  textSlides: [],
  updatedAt: "2026-10-11T00:00:00.000Z",
};

describe("AboutUsBannerPage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    upsertMock.mockReset();
    showSuccessMock.mockReset();
    showErrorMock.mockReset();
    fetchMock.mockResolvedValue(sampleDto);
    upsertMock.mockResolvedValue(sampleDto);
  });

  it("loads config for the selected site", async () => {
    render(<AboutUsBannerPage siteCode="IN" />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("IN"));
    expect(await screen.findByDisplayValue("Curated selections")).toBeInTheDocument();
  });

  it("saves after validation", async () => {
    const user = userEvent.setup();
    render(<AboutUsBannerPage siteCode="IN" />);
    await screen.findByDisplayValue("Curated selections");

    await user.click(screen.getByRole("button", { name: /save banner/i }));

    await waitFor(() => expect(upsertMock).toHaveBeenCalledWith("IN", expect.any(Object)));
    expect(showSuccessMock).toHaveBeenCalledWith("About Us banner saved");
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CompanyBasicInfoPage } from "@/components/company-basic-info/company-basic-info-page";

const fetchMock = jest.fn();
const upsertMock = jest.fn();
const showSuccessMock = jest.fn();
const showErrorMock = jest.fn();

jest.mock("@/services/api/company-basic-info", () => ({
  fetchCompanyBasicInfo: (...args: unknown[]) => fetchMock(...args),
  upsertCompanyBasicInfo: (...args: unknown[]) => upsertMock(...args),
  uploadCompanyLogo: jest.fn(),
}));

jest.mock("@/lib/toast", () => ({
  showSuccess: (...args: unknown[]) => showSuccessMock(...args),
  showError: (...args: unknown[]) => showErrorMock(...args),
  showInfo: jest.fn(),
  showWarning: jest.fn(),
}));

jest.mock("@/components/layout/admin-app-shell", () => ({
  AdminAppShell: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

describe("CompanyBasicInfoPage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    upsertMock.mockReset();
    showSuccessMock.mockReset();
    showErrorMock.mockReset();
    fetchMock.mockResolvedValue({
      id: null,
      siteCode: "IN",
      companyName: "",
      companyDomainName: "",
      contactNumbers: [],
      whatsappNumber: "",
      mainLogo: { url: "", publicId: "" },
      footerLogo: { url: "", publicId: "" },
      mobileUiLogo: { url: "", publicId: "" },
      emails: [],
      officeAddresses: [],
      googleAddress: "",
      googleUrl: "",
      googleLink: "",
      facebookLink: "",
      instagramLink: "",
      youtubeLink: "",
      googleMapLink: "",
      googleTrackingTag: "",
      titleTagForMainLandingPage: "",
      keywords: [],
      updatedAt: null,
    });
  });

  it("loads empty defaults for the site", async () => {
    render(<CompanyBasicInfoPage siteCode="IN" />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("IN"));
    expect(await screen.findByLabelText(/company name/i)).toBeInTheDocument();
  });

  it("validates before save", async () => {
    const user = userEvent.setup();
    render(<CompanyBasicInfoPage siteCode="IN" />);
    await screen.findByLabelText(/company name/i);

    await user.click(screen.getByRole("button", { name: /save settings/i }));

    expect(upsertMock).not.toHaveBeenCalled();
    expect(showErrorMock).toHaveBeenCalled();
  });

  it("saves a valid form", async () => {
    const user = userEvent.setup();
    upsertMock.mockResolvedValue({
      id: "rec-1",
      siteCode: "IN",
      companyName: "SkinDx",
      companyDomainName: "skindxbioceuticals.in",
      contactNumbers: ["9876543210"],
      whatsappNumber: "",
      mainLogo: { url: "", publicId: "" },
      footerLogo: { url: "", publicId: "" },
      mobileUiLogo: { url: "", publicId: "" },
      emails: [],
      officeAddresses: [],
      googleAddress: "",
      googleUrl: "",
      googleLink: "",
      facebookLink: "",
      instagramLink: "",
      youtubeLink: "",
      googleMapLink: "",
      googleTrackingTag: "",
      titleTagForMainLandingPage: "",
      keywords: [],
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    render(<CompanyBasicInfoPage siteCode="IN" />);
    await screen.findByLabelText(/company name/i);

    await user.type(screen.getByLabelText(/company name/i), "SkinDx");
    await user.type(screen.getByLabelText(/domain name/i), "skindxbioceuticals.in");
    await user.click(screen.getByRole("button", { name: /save settings/i }));

    await waitFor(() => expect(upsertMock).toHaveBeenCalled());
    expect(upsertMock.mock.calls[0]?.[0]).toBe("IN");
    expect(upsertMock.mock.calls[0]?.[1]).toMatchObject({
      companyName: "SkinDx",
      companyDomainName: "skindxbioceuticals.in",
    });
    expect(showSuccessMock).toHaveBeenCalledWith("Company basic info saved");
  });
});

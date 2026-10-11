import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ManageNavbarPage } from "@/components/manage-navbar/manage-navbar-page";

const fetchMock = jest.fn();
const createMock = jest.fn();
const updateMock = jest.fn();
const patchMock = jest.fn();
const deleteMock = jest.fn();
const showSuccessMock = jest.fn();
const showErrorMock = jest.fn();

jest.mock("@/services/api/manage-navbar", () => ({
  fetchNavbarSections: (...args: unknown[]) => fetchMock(...args),
  createNavbarSection: (...args: unknown[]) => createMock(...args),
  updateNavbarSection: (...args: unknown[]) => updateMock(...args),
  patchNavbarSectionActive: (...args: unknown[]) => patchMock(...args),
  deleteNavbarSection: (...args: unknown[]) => deleteMock(...args),
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

describe("ManageNavbarPage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    createMock.mockReset();
    updateMock.mockReset();
    patchMock.mockReset();
    deleteMock.mockReset();
    showSuccessMock.mockReset();
    showErrorMock.mockReset();
    fetchMock.mockResolvedValue([]);
  });

  it("loads sections for the selected site", async () => {
    render(<ManageNavbarPage siteCode="IN" />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("IN"));
    expect(await screen.findByLabelText(/section title/i)).toBeInTheDocument();
  });

  it("validates before create", async () => {
    const user = userEvent.setup();
    render(<ManageNavbarPage siteCode="IN" />);
    await screen.findByLabelText(/section title/i);

    await user.click(screen.getByRole("button", { name: /create section/i }));

    expect(createMock).not.toHaveBeenCalled();
    expect(showErrorMock).toHaveBeenCalled();
  });

  it("creates a section after validation", async () => {
    const user = userEvent.setup();
    createMock.mockResolvedValue({
      id: "sec-1",
      siteCode: "IN",
      title: "Shop",
      url: "/shop",
      active: true,
      order: 1,
      subSections: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    render(<ManageNavbarPage siteCode="IN" />);
    await screen.findByLabelText(/section title/i);

    await user.type(screen.getByLabelText(/section title/i), "Shop");
    await user.clear(screen.getByLabelText(/section url/i));
    await user.type(screen.getByLabelText(/section url/i), "/shop");
    await user.click(screen.getByRole("button", { name: /create section/i }));

    await waitFor(() => expect(createMock).toHaveBeenCalled());
    expect(createMock).toHaveBeenCalledWith(
      "IN",
      expect.objectContaining({
        title: "Shop",
        url: "/shop",
      }),
    );
    expect(showSuccessMock).toHaveBeenCalledWith("Navbar section created");
  });
});

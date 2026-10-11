import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { GalleryPage } from "@/components/gallery/gallery-page";

const fetchMock = jest.fn();
const deleteMock = jest.fn();
const patchMock = jest.fn();
const updateMock = jest.fn();
const showSuccessMock = jest.fn();
const showErrorMock = jest.fn();

jest.mock("@/services/api/gallery", () => ({
  fetchGalleryItems: (...args: unknown[]) => fetchMock(...args),
  deleteGalleryItem: (...args: unknown[]) => deleteMock(...args),
  patchGalleryItem: (...args: unknown[]) => patchMock(...args),
  updateGalleryItem: (...args: unknown[]) => updateMock(...args),
  createGalleryItem: jest.fn(),
  uploadGalleryImage: jest.fn(),
  uploadGalleryVideo: jest.fn(),
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

const sampleItem = {
  id: "11111111-1111-4111-8111-111111111111",
  siteCode: "IN" as const,
  mediaType: "image" as const,
  mediaUrl: "https://cdn.example.com/gallery.jpg",
  mediaPublicId: "gallery/img",
  title: "Clinic moment",
  caption: "Lookbook shot",
  active: true,
  order: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("GalleryPage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    deleteMock.mockReset();
    patchMock.mockReset();
    updateMock.mockReset();
    showSuccessMock.mockReset();
    showErrorMock.mockReset();
    fetchMock.mockResolvedValue([sampleItem]);
    deleteMock.mockResolvedValue(undefined);
  });

  it("loads gallery items for the selected site", async () => {
    render(<GalleryPage siteCode="IN" />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("IN"));
    expect(await screen.findByText("Clinic moment")).toBeInTheDocument();
  });

  it("does not delete until the inline confirmation is confirmed", async () => {
    const user = userEvent.setup();
    render(<GalleryPage siteCode="IN" />);
    await screen.findByText("Clinic moment");

    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(deleteMock).not.toHaveBeenCalled();
    expect(
      screen.getByText(/remove this item permanently/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /confirm delete/i }));

    await waitFor(() =>
      expect(deleteMock).toHaveBeenCalledWith("IN", sampleItem.id),
    );
    expect(showSuccessMock).toHaveBeenCalledWith("Gallery item deleted");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("cancels inline delete confirmation without calling the API", async () => {
    const user = userEvent.setup();
    render(<GalleryPage siteCode="IN" />);
    await screen.findByText("Clinic moment");

    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(
      screen.getByText(/remove this item permanently/i),
    ).toBeInTheDocument();

    // Prefer the enabled Cancel next to Confirm delete (form Cancel is disabled).
    const cancelButtons = screen.getAllByRole("button", { name: /^cancel$/i });
    const enabledCancel = cancelButtons.find(
      (button) => !(button as HTMLButtonElement).disabled,
    );
    expect(enabledCancel).toBeTruthy();
    await user.click(enabledCancel!);

    expect(deleteMock).not.toHaveBeenCalled();
    expect(
      screen.queryByText(/remove this item permanently/i),
    ).not.toBeInTheDocument();
  });
});

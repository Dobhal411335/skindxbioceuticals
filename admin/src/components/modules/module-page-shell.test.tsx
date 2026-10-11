import { render, screen } from "@testing-library/react";

import { ModulePageShell } from "@/components/modules/module-page-shell";
import type { AdminModuleDefinition } from "@/config/admin-modules";

jest.mock("next/navigation", () => ({
  usePathname: () => "/admin/com/product-information",
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { id: "1", email: "admin@skindx.test", role: "ADMIN", firstName: "Ada" },
    logout: jest.fn(),
  }),
}));

const productInfoModule: AdminModuleDefinition = {
  id: "product-information",
  slug: "product-information",
  label: "Product Information",
  description: "Maintain corporate product information for the .com website.",
  sites: ["COM"],
  status: "shell",
};

describe("ModulePageShell", () => {
  it("renders a reusable shell without fabricated data", () => {
    render(<ModulePageShell siteCode="COM" module={productInfoModule} />);

    expect(screen.getByTestId("module-page-shell")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Product Information" })).toBeInTheDocument();
    expect(screen.getByText(/No placeholder records or fabricated business data/i)).toBeInTheDocument();
    expect(screen.getAllByText(/India · \.com/i).length).toBeGreaterThan(0);
  });
});

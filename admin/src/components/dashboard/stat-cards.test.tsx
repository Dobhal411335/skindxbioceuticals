import { render, screen } from "@testing-library/react";
import { ShoppingBag } from "lucide-react";

import { StatCards, StatCardsSkeleton } from "@/components/dashboard/stat-cards";

describe("StatCards", () => {
  it("renders provided statistics", () => {
    render(
      <StatCards
        items={[
          {
            id: "orders",
            label: "Total orders",
            value: "12",
            icon: ShoppingBag,
          },
        ]}
      />,
    );

    expect(screen.getByTestId("stat-cards")).toHaveTextContent("Total orders");
    expect(screen.getByTestId("stat-cards")).toHaveTextContent("12");
  });

  it("renders a link when href is provided", () => {
    render(
      <StatCards
        items={[
          {
            id: "vendor-orders",
            label: "Vendor orders",
            value: "5",
            icon: ShoppingBag,
            href: "/admin/in/orders/vendor",
          },
        ]}
      />,
    );

    const link = screen.getByRole("link", { name: /vendor orders/i });
    expect(link).toHaveAttribute("href", "/admin/in/orders/vendor");
    expect(link).toHaveTextContent("5");
  });

  it("renders loading skeletons", () => {
    render(<StatCardsSkeleton count={3} />);
    expect(screen.getByTestId("stat-cards-skeleton")).toBeInTheDocument();
  });
});

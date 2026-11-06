import { render, screen } from "@testing-library/react";

import { FaqPageView } from "@/components/faq/faq-page-view";
import { FALLBACK_COMPANY_BASIC_INFO } from "@/features/company-basic-info/company-basic-info.defaults";
import { CompanyBasicInfoProvider } from "@/providers/company-basic-info-provider";
import type { CompanyBasicInfo } from "@/types/company-basic-info";

const sections = [
  {
    id: "orders",
    title: "Orders",
    items: [{ id: "o1", question: "How do I order?", answer: "Use checkout." }],
  },
];

function renderFaq(company: CompanyBasicInfo) {
  return render(
    <CompanyBasicInfoProvider value={company}>
      <FaqPageView sections={sections} />
    </CompanyBasicInfoProvider>,
  );
}

describe("FaqPageView company contact", () => {
  it("shows email, phone, and address from company info", () => {
    renderFaq({
      ...FALLBACK_COMPANY_BASIC_INFO,
      emails: ["care@skindxbioceuticals.in"],
      contactNumbers: ["8800424431"],
      officeAddresses: ["122, Bhogal Road, Delhi 110014"],
    });

    expect(screen.getByRole("link", { name: "care@skindxbioceuticals.in" })).toHaveAttribute(
      "href",
      "mailto:care@skindxbioceuticals.in",
    );
    expect(screen.getByRole("link", { name: "+91 88004 24431" })).toHaveAttribute(
      "href",
      "tel:+918800424431",
    );
    expect(screen.getByText("122, Bhogal Road, Delhi 110014")).toBeInTheDocument();
    expect(screen.queryByText("hello@skindxbioceuticals.example")).not.toBeInTheDocument();
  });

  it("omits contact cards when company info has no email, phone, or address", () => {
    renderFaq(FALLBACK_COMPANY_BASIC_INFO);

    expect(screen.queryByRole("heading", { name: "Email" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Phone" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Address" })).not.toBeInTheDocument();
    expect(screen.queryByText("hello@skindxbioceuticals.example")).not.toBeInTheDocument();
  });
});

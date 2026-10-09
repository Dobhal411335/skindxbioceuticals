import type { Metadata } from "next";

import { FaqPageView } from "@/components/faq/faq-page-view";

export const metadata: Metadata = {
  title: "FAQs | SkinDx Bioceuticals",
  description: "Frequently asked questions about SkinDx Bioc India.",
};

export default function FaqPage() {
  return <FaqPageView />;
}

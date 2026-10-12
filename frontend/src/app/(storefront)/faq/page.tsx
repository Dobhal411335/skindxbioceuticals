import type { Metadata } from "next";

import { FaqPageView } from "@/components/faq/faq-page-view";
import { getFaqSections } from "@/features/faq/faq.service";

export const metadata: Metadata = {
  title: "FAQs | SkinDx Bioceuticals",
  description: "Frequently asked questions about SkinDx Bioc India.",
};

export default async function FaqPage() {
  const sections = await getFaqSections();
  return <FaqPageView sections={sections} />;
}

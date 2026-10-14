import type { Metadata } from "next";

import { ThankYouPageView } from "@/components/checkout/thank-you-page-view";

export const metadata: Metadata = {
  title: "Thank you | SkinDx Bioc",
  description: "Your order confirmation",
};

export default function ThankYouPage() {
  return <ThankYouPageView />;
}

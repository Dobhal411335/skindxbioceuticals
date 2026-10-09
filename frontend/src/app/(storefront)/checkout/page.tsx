import type { Metadata } from "next";

import { CheckoutPageView } from "@/components/checkout/checkout-page-view";

export const metadata: Metadata = {
  title: "Checkout | SkinDx Bioceuticals",
  description: "Complete your SkinDx Bioc order.",
};

export default function CheckoutPage() {
  return <CheckoutPageView />;
}

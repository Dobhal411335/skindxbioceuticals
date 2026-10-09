import type { Metadata } from "next";

import { CartPageView } from "@/components/cart/cart-page-view";

export const metadata: Metadata = {
  title: "Your cart | SkinDx Bioceuticals",
  description: "Review items in your SkinDx Bioc cart.",
};

export default function CartPage() {
  return <CartPageView />;
}

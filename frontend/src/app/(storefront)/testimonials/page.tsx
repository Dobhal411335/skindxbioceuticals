import type { Metadata } from "next";

import { TestimonialsPageView } from "@/components/landing/testimonials-page-view";
import { getCustomerReviews } from "@/features/customer-reviews/customer-reviews.service";

export const metadata: Metadata = {
  title: "Testimonials | SkinDx Bioceuticals",
  description: "Read what customers say about SkinDx Bioceuticals.",
};

export default async function TestimonialsPage() {
  const reviews = await getCustomerReviews();
  return <TestimonialsPageView reviews={reviews} />;
}

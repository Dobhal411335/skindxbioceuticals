import { cache } from "react";

import type { CustomerReview } from "@/types/customer-reviews";

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

const STOREFRONT_SITE_CODE = "IN" as const;

function apiBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!value) {
    return "";
  }
  return value.replace(/\/$/, "");
}

/**
 * Server-side fetch of active site-scoped customer reviews for the .in storefront.
 */
export const getCustomerReviews = cache(async (): Promise<CustomerReview[]> => {
  const base = apiBaseUrl();
  if (!base) {
    return [];
  }

  try {
    const response = await fetch(
      `${base}/sites/${STOREFRONT_SITE_CODE}/customer-reviews`,
      {
        next: { revalidate: 60, tags: ["customer-reviews", "IN"] },
        headers: { Accept: "application/json" },
      },
    );

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as ApiSuccess<CustomerReview[]>;
    if (!payload?.success || !Array.isArray(payload.data)) {
      return [];
    }

    return payload.data.filter(
      (item) =>
        item.active &&
        item.customerName &&
        item.description &&
        item.imageUrl &&
        item.rating >= 1 &&
        item.rating <= 5,
    );
  } catch {
    return [];
  }
});

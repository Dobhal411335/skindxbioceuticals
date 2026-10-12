import { cache } from "react";

import type { PublicCategory, PublicCategoryDetail } from "@/types/catalog";

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
 * Server-side fetch of active site-scoped categories for the .in storefront.
 */
export const getCategories = cache(async (): Promise<PublicCategory[]> => {
  const base = apiBaseUrl();
  if (!base) {
    return [];
  }

  try {
    const response = await fetch(`${base}/sites/${STOREFRONT_SITE_CODE}/categories`, {
      next: { revalidate: 60, tags: ["categories", "IN"] },
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as ApiSuccess<PublicCategory[]>;
    if (!payload?.success || !Array.isArray(payload.data)) {
      return [];
    }

    return payload.data.filter((item) => item.name && item.slug);
  } catch {
    return [];
  }
});

/**
 * Server-side fetch of one category (by slug or name) with subcategory products.
 */
export const getCategoryBySlugOrName = cache(
  async (categoryName: string): Promise<PublicCategoryDetail | null> => {
    const base = apiBaseUrl();
    if (!base || !categoryName.trim()) {
      return null;
    }

    try {
      const encoded = encodeURIComponent(categoryName.trim());
      const response = await fetch(
        `${base}/sites/${STOREFRONT_SITE_CODE}/categories/${encoded}`,
        {
          next: { revalidate: 60, tags: ["categories", "IN", categoryName] },
          headers: { Accept: "application/json" },
        },
      );

      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as ApiSuccess<PublicCategoryDetail>;
      if (!payload?.success || !payload.data?.id) {
        return null;
      }

      return payload.data;
    } catch {
      return null;
    }
  },
);

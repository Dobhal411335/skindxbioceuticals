import { cache } from "react";

import type {
  PublicProductCard,
  PublicProductDetail,
  PublicProductHighlights,
} from "@/types/product";

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
 * Server-side fetch of one ACTIVE product by slug for the .in storefront PDP.
 */
export const getProductBySlug = cache(
  async (slug: string): Promise<PublicProductDetail | null> => {
    const base = apiBaseUrl();
    if (!base || !slug.trim()) {
      return null;
    }

    try {
      const encoded = encodeURIComponent(slug.trim());
      const response = await fetch(
        `${base}/sites/${STOREFRONT_SITE_CODE}/products/${encoded}`,
        {
          next: { revalidate: 60, tags: ["products", "IN", slug] },
          headers: { Accept: "application/json" },
        },
      );

      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as ApiSuccess<PublicProductDetail>;
      if (!payload?.success || !payload.data?.id || !payload.data?.slug) {
        return null;
      }

      return payload.data;
    } catch {
      return null;
    }
  },
);

/**
 * ACTIVE product cards for the landing featured rail (site-scoped).
 */
export const getLandingProducts = cache(
  async (limit = 15): Promise<PublicProductCard[]> => {
    const base = apiBaseUrl();
    if (!base) {
      return [];
    }

    try {
      const response = await fetch(
        `${base}/sites/${STOREFRONT_SITE_CODE}/products?limit=${limit}`,
        {
          next: { revalidate: 60, tags: ["products", "IN", "landing-rail"] },
          headers: { Accept: "application/json" },
        },
      );

      if (!response.ok) {
        return [];
      }

      const payload = (await response.json()) as ApiSuccess<PublicProductCard[]>;
      if (!payload?.success || !Array.isArray(payload.data)) {
        return [];
      }

      return payload.data.filter((item) => item?.id && item?.slug);
    } catch {
      return [];
    }
  },
);

/**
 * Recent / Featured / Best-seller buckets for landing highlight columns.
 */
export const getLandingProductHighlights = cache(
  async (): Promise<PublicProductHighlights> => {
    const empty: PublicProductHighlights = {
      recent: [],
      featured: [],
      bestSellers: [],
    };
    const base = apiBaseUrl();
    if (!base) {
      return empty;
    }

    try {
      const response = await fetch(
        `${base}/sites/${STOREFRONT_SITE_CODE}/products/highlights`,
        {
          next: {
            revalidate: 60,
            tags: ["products", "IN", "landing-highlights"],
          },
          headers: { Accept: "application/json" },
        },
      );

      if (!response.ok) {
        return empty;
      }

      const payload = (await response.json()) as ApiSuccess<PublicProductHighlights>;
      if (!payload?.success || !payload.data) {
        return empty;
      }

      return {
        recent: Array.isArray(payload.data.recent) ? payload.data.recent : [],
        featured: Array.isArray(payload.data.featured)
          ? payload.data.featured
          : [],
        bestSellers: Array.isArray(payload.data.bestSellers)
          ? payload.data.bestSellers
          : [],
      };
    } catch {
      return empty;
    }
  },
);

/** Client-side PDP fetch for quick view (uses same public detail endpoint). */
export async function fetchProductBySlugClient(
  slug: string,
): Promise<PublicProductDetail | null> {
  const base = apiBaseUrl();
  if (!base || !slug.trim()) {
    return null;
  }

  try {
    const encoded = encodeURIComponent(slug.trim());
    const response = await fetch(
      `${base}/sites/${STOREFRONT_SITE_CODE}/products/${encoded}`,
      { headers: { Accept: "application/json" }, cache: "no-store" },
    );
    if (!response.ok) {
      return null;
    }
    const payload = (await response.json()) as ApiSuccess<PublicProductDetail>;
    if (!payload?.success || !payload.data?.id || !payload.data?.slug) {
      return null;
    }
    return payload.data;
  } catch {
    return null;
  }
}

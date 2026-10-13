import { cache } from "react";

import { API_ENDPOINTS } from "@/services/api/endpoints";
import type {
  CatalogProductQuery,
  PublicProductCard,
  PublicProductDetail,
  PublicProductFacets,
  PublicProductHighlights,
  PublicProductListMeta,
  PublicProductListResult,
} from "@/types/product";

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
  meta?: PublicProductListMeta;
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
        `${base}${API_ENDPOINTS.PRODUCTS.PUBLIC_LIST(STOREFRONT_SITE_CODE)}?limit=${limit}`,
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

export const getProductFacets = cache(
  async (): Promise<PublicProductFacets> => {
    const empty: PublicProductFacets = {
      categories: [],
      price: { min: 0, max: 0 },
    };
    const base = apiBaseUrl();
    if (!base) {
      return empty;
    }

    try {
      const response = await fetch(
        `${base}${API_ENDPOINTS.PRODUCTS.PUBLIC_FACETS(STOREFRONT_SITE_CODE)}`,
        {
          next: { revalidate: 60, tags: ["products", "IN", "product-facets"] },
          headers: { Accept: "application/json" },
        },
      );
      if (!response.ok) {
        return empty;
      }
      const payload = (await response.json()) as ApiSuccess<PublicProductFacets>;
      if (!payload?.success || !payload.data) {
        return empty;
      }
      return {
        categories: Array.isArray(payload.data.categories)
          ? payload.data.categories
          : [],
        price: {
          min: Number(payload.data.price?.min ?? 0),
          max: Number(payload.data.price?.max ?? 0),
        },
      };
    } catch {
      return empty;
    }
  },
);

function buildCatalogQueryString(query: CatalogProductQuery): string {
  const params = new URLSearchParams();
  if (query.q?.trim()) params.set("q", query.q.trim());
  if (query.categorySlug) params.set("categorySlug", query.categorySlug);
  if (query.priceMin != null) params.set("priceMin", String(query.priceMin));
  if (query.priceMax != null) params.set("priceMax", String(query.priceMax));
  if (query.availability) params.set("availability", query.availability);
  if (query.sort) params.set("sort", query.sort);
  if (query.page != null) params.set("page", String(query.page));
  if (query.offset != null) params.set("offset", String(query.offset));
  if (query.limit != null) params.set("limit", String(query.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Client-side shop PLP fetch with filters / pagination. */
export async function fetchCatalogProducts(
  query: CatalogProductQuery,
): Promise<PublicProductListResult> {
  const empty: PublicProductListResult = {
    items: [],
    meta: { page: query.page ?? 1, limit: query.limit ?? 16, total: 0, totalPages: 0 },
  };
  const base = apiBaseUrl();
  if (!base) {
    return empty;
  }

  try {
    const response = await fetch(
      `${base}${API_ENDPOINTS.PRODUCTS.PUBLIC_LIST(STOREFRONT_SITE_CODE)}${buildCatalogQueryString(query)}`,
      { headers: { Accept: "application/json" }, cache: "no-store" },
    );
    if (!response.ok) {
      return empty;
    }
    const payload = (await response.json()) as ApiSuccess<PublicProductCard[]>;
    if (!payload?.success || !Array.isArray(payload.data)) {
      return empty;
    }
    return {
      items: payload.data.filter((item) => item?.id && item?.slug),
      meta: {
        page: Number(payload.meta?.page ?? query.page ?? 1),
        limit: Number(payload.meta?.limit ?? query.limit ?? 16),
        total: Number(payload.meta?.total ?? payload.data.length),
        totalPages: Number(payload.meta?.totalPages ?? 0),
      },
    };
  } catch {
    return empty;
  }
}

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

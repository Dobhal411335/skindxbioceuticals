import { publicSiteHeaders } from "@/lib/public-site-fetch";
import { storefrontSiteCode } from "@/config/site";
import { cache } from "react";

import { API_ENDPOINTS } from "@/services/api/endpoints";
import type { PublicCategory, PublicCategoryDetail } from "@/types/catalog";

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};


/** Flat search index entry for main categories and subcategories. */
export type SearchCatalogEntry = {
  id: string;
  kind: "category" | "subcategory";
  name: string;
  slug: string;
  mainSlug: string;
  mainName: string;
  href: string;
  imageUrl: string | null;
};

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
    const response = await fetch(`${base}/sites/${storefrontSiteCode}/category`, {
      next: { revalidate: 60, tags: ["categories", storefrontSiteCode] },
      headers: publicSiteHeaders(),
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
        `${base}/sites/${storefrontSiteCode}/category/${encoded}`,
        {
          next: { revalidate: 60, tags: ["categories", storefrontSiteCode, categoryName] },
          headers: publicSiteHeaders(),
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

/** Client-side root categories for search matching. */
export async function fetchPublicCategoriesClient(): Promise<PublicCategory[]> {
  try {
    const { apiClient } = await import("@/services/api/axios");
    const response = await apiClient.get<ApiSuccess<PublicCategory[]>>(
      API_ENDPOINTS.CATEGORIES.PUBLIC(storefrontSiteCode),
    );
    const payload = response.data;
    if (!payload?.success || !Array.isArray(payload.data)) {
      return [];
    }
    return payload.data.filter((item) => item?.name && item?.slug);
  } catch {
    return [];
  }
}

/** Client-side category detail (includes subcategories) for search matching. */
export async function fetchPublicCategoryDetailClient(
  slugOrName: string,
): Promise<PublicCategoryDetail | null> {
  if (!slugOrName.trim()) return null;
  try {
    const { apiClient } = await import("@/services/api/axios");
    const response = await apiClient.get<ApiSuccess<PublicCategoryDetail>>(
      API_ENDPOINTS.CATEGORIES.PUBLIC_DETAIL(storefrontSiteCode, slugOrName.trim()),
    );
    const payload = response.data;
    if (!payload?.success || !payload.data?.id || !payload.data?.slug) {
      return null;
    }
    return payload.data;
  } catch {
    return null;
  }
}

/** Build a searchable main + subcategory index for the storefront search overlay. */
export async function fetchSearchCatalogIndex(): Promise<SearchCatalogEntry[]> {
  const roots = await fetchPublicCategoriesClient();
  if (roots.length === 0) return [];

  const details = await Promise.all(
    roots.map((root) => fetchPublicCategoryDetailClient(root.slug)),
  );

  const entries: SearchCatalogEntry[] = [];
  for (let i = 0; i < roots.length; i += 1) {
    const root = roots[i]!;
    const detail = details[i];
    const mainSlug = detail?.slug || root.slug;
    const mainName = detail?.name || root.name;
    const mainImage = detail?.bannerUrl || root.bannerUrl || null;

    entries.push({
      id: root.id,
      kind: "category",
      name: mainName,
      slug: mainSlug,
      mainSlug,
      mainName,
      href: `/category/${encodeURIComponent(mainSlug)}`,
      imageUrl: mainImage,
    });

    for (const sub of detail?.subcategories ?? []) {
      if (!sub?.name || !sub?.slug) continue;
      entries.push({
        id: sub.id,
        kind: "subcategory",
        name: sub.name,
        slug: sub.slug,
        mainSlug,
        mainName,
        href: `/category/${encodeURIComponent(mainSlug)}/${encodeURIComponent(sub.slug)}`,
        imageUrl: sub.bannerUrl,
      });
    }
  }

  return entries;
}

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase();
}

/** Filter catalog entries that match the typed search query. */
export function filterSearchCatalogEntries(
  entries: SearchCatalogEntry[],
  query: string,
  limit = 6,
): SearchCatalogEntry[] {
  const q = normalizeSearchText(query);
  if (!q) return [];

  const scored = entries
    .map((entry) => {
      const name = normalizeSearchText(entry.name);
      const slug = normalizeSearchText(entry.slug);
      let score = 0;
      if (name === q || slug === q) score = 100;
      else if (name.startsWith(q) || slug.startsWith(q)) score = 80;
      else if (name.includes(q) || slug.includes(q)) score = 50;
      else return null;
      // Prefer subcategory matches slightly when scores tie.
      if (entry.kind === "subcategory") score += 1;
      return { entry, score };
    })
    .filter((item): item is { entry: SearchCatalogEntry; score: number } => item != null)
    .sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name));

  return scored.slice(0, limit).map((item) => item.entry);
}

/**
 * Resolve Enter-key destination: exact/strong category match → category page,
 * otherwise product shop search.
 */
export function resolveSearchDestination(
  query: string,
  entries: SearchCatalogEntry[],
): string {
  const trimmed = query.trim();
  if (!trimmed) return "/category";

  const matches = filterSearchCatalogEntries(entries, trimmed, 8);
  if (matches.length === 0) {
    return "/category";
  }

  const q = normalizeSearchText(trimmed);
  const exact = matches.find(
    (entry) =>
      normalizeSearchText(entry.name) === q || normalizeSearchText(entry.slug) === q,
  );
  if (exact) return exact.href;

  const startsWith = matches.filter(
    (entry) =>
      normalizeSearchText(entry.name).startsWith(q) ||
      normalizeSearchText(entry.slug).startsWith(q),
  );
  if (startsWith.length === 1) return startsWith[0]!.href;

  if (matches.length === 1) return matches[0]!.href;

  return "/category";
}

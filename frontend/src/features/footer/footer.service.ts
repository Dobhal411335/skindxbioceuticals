import { cache } from "react";

import { FALLBACK_FOOTER } from "@/features/footer/footer.defaults";
import type { FooterConfig, StorefrontFooter } from "@/types/footer";

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

export function mapFooterConfigToStorefront(
  config: FooterConfig,
): StorefrontFooter {
  const columns = [...(config.columns || [])]
    .filter((column) => column.active)
    .sort((left, right) => (left.order || 0) - (right.order || 0))
    .map((column) => ({
      title: column.title,
      links: [...(column.links || [])]
        .filter((link) => link.active)
        .sort((left, right) => (left.order || 0) - (right.order || 0))
        .map((link) => ({
          label: link.label,
          href: link.url || "#",
        })),
    }))
    .filter((column) => column.links.length > 0);

  return {
    thankYou: config.thankYou?.trim() || FALLBACK_FOOTER.thankYou,
    description: config.description?.trim() || FALLBACK_FOOTER.description,
    columns: columns.length > 0 ? columns : FALLBACK_FOOTER.columns,
  };
}

/**
 * Server-side fetch of footer config for the .in storefront.
 * Cached per request via React `cache`. Falls back to static landing data.
 */
export const getFooterConfig = cache(async (): Promise<StorefrontFooter> => {
  const base = apiBaseUrl();
  if (!base) {
    return FALLBACK_FOOTER;
  }

  try {
    const response = await fetch(
      `${base}/sites/${STOREFRONT_SITE_CODE}/footer`,
      {
        next: { revalidate: 60, tags: ["footer", "IN"] },
        headers: { Accept: "application/json" },
      },
    );

    if (!response.ok) {
      return FALLBACK_FOOTER;
    }

    const payload = (await response.json()) as ApiSuccess<FooterConfig>;
    if (!payload?.success || !payload.data) {
      return FALLBACK_FOOTER;
    }

    // Empty config (no id / no managed content) → static fallback columns/copy.
    if (!payload.data.id) {
      return FALLBACK_FOOTER;
    }

    return mapFooterConfigToStorefront(payload.data);
  } catch {
    return FALLBACK_FOOTER;
  }
});

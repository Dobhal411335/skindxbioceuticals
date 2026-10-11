import { cache } from "react";

import type { GalleryItem } from "@/types/gallery";

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
 * Server-side fetch of active site-scoped gallery items for the .in storefront.
 */
export const getGalleryItems = cache(async (): Promise<GalleryItem[]> => {
  const base = apiBaseUrl();
  if (!base) {
    return [];
  }

  try {
    const response = await fetch(
      `${base}/sites/${STOREFRONT_SITE_CODE}/gallery`,
      {
        next: { revalidate: 60, tags: ["gallery", "IN"] },
        headers: { Accept: "application/json" },
      },
    );

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as ApiSuccess<GalleryItem[]>;
    if (!payload?.success || !Array.isArray(payload.data)) {
      return [];
    }

    return payload.data.filter(
      (item) => item.active && item.mediaUrl && (item.mediaType === "image" || item.mediaType === "video"),
    );
  } catch {
    return [];
  }
});

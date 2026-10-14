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

function isRenderableGalleryItem(item: GalleryItem): boolean {
  if (!item.active) return false;
  if (item.mediaType === "text_card") {
    return Boolean(item.heading?.trim() && item.description?.trim());
  }
  return Boolean(
    item.mediaUrl &&
      (item.mediaType === "image" || item.mediaType === "video"),
  );
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

    return payload.data
      .map((item) => ({
        ...item,
        clickUrl: item.clickUrl ?? "",
        heading: item.heading ?? "",
        description: item.description ?? "",
        buttonLabel: item.buttonLabel ?? "",
        buttonUrl: item.buttonUrl ?? "",
      }))
      .filter(isRenderableGalleryItem);
  } catch {
    return [];
  }
});

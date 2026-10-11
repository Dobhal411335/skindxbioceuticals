import { cache } from "react";

import type { SocialPost } from "@/types/social-posts";

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
 * Server-side fetch of active site-scoped social posts for the .in storefront.
 */
export const getSocialPosts = cache(async (): Promise<SocialPost[]> => {
  const base = apiBaseUrl();
  if (!base) {
    return [];
  }

  try {
    const response = await fetch(
      `${base}/sites/${STOREFRONT_SITE_CODE}/social-posts`,
      {
        next: { revalidate: 60, tags: ["social-posts", "IN"] },
        headers: { Accept: "application/json" },
      },
    );

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as ApiSuccess<SocialPost[]>;
    if (!payload?.success || !Array.isArray(payload.data)) {
      return [];
    }

    return payload.data.filter((post) => post.active && post.imageUrl && post.postUrl);
  } catch {
    return [];
  }
});

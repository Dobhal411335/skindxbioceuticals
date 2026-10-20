import { cache } from "react";

import type { StorefrontWebpage } from "@/features/webpages/webpage.types";

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

const STOREFRONT_SITE_CODE = "IN" as const;

function apiBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!value) return "";
  return value.replace(/\/$/, "");
}

function preferHttps(url: string): string {
  if (url.startsWith("http://res.cloudinary.com/")) {
    return `https://${url.slice("http://".length)}`;
  }
  return url;
}

function mapImage(
  value: unknown,
): { url: string; key: string } | null {
  if (!value || typeof value !== "object") {
    if (typeof value === "string" && value.trim()) {
      return { url: preferHttps(value), key: "" };
    }
    return null;
  }
  const img = value as Record<string, unknown>;
  const url =
    typeof img.url === "string"
      ? img.url
      : typeof img.secureUrl === "string"
        ? img.secureUrl
        : "";
  if (!url) return null;
  return {
    url: preferHttps(url),
    key:
      typeof img.key === "string"
        ? img.key
        : typeof img.publicId === "string"
          ? img.publicId
          : "",
  };
}

function mapWebpage(row: Record<string, unknown>): StorefrontWebpage {
  return {
    id: String(row.id || ""),
    siteCode: "IN",
    title: String(row.title || ""),
    slug: String(row.slug || ""),
    active: true,
    templateType: String(row.templateType || "design1"),
    titleLine: String(row.titleLine || ""),
    keywords: Array.isArray(row.keywords)
      ? row.keywords.map((k) => String(k || ""))
      : [],
    firstTitle: String(row.firstTitle || ""),
    secondTitle: String(row.secondTitle || ""),
    imageFirst: mapImage(row.imageFirst),
    imageFirstMobile: mapImage(row.imageFirstMobile),
    bannerImage: mapImage(row.bannerImage),
    bannerImageMobile: mapImage(row.bannerImageMobile),
    paragraphFirstImage: mapImage(row.paragraphFirstImage),
    paragraphSecondImage: mapImage(row.paragraphSecondImage),
    advertisementImage: mapImage(row.advertisementImage),
    sideThumbImage: mapImage(row.sideThumbImage),
    mainProfileImage: mapImage(row.mainProfileImage),
    createTags: Array.isArray(row.createTags)
      ? row.createTags.map((t) => String(t || ""))
      : [],
    postedBy: (row.postedBy as StorefrontWebpage["postedBy"]) || null,
    highlights: Array.isArray(row.highlights)
      ? (row.highlights as StorefrontWebpage["highlights"])
      : [],
    paragraphSections: Array.isArray(row.paragraphSections)
      ? (row.paragraphSections as StorefrontWebpage["paragraphSections"])
      : [],
    tableTitle: String(row.tableTitle || ""),
    tableRows: Array.isArray(row.tableRows)
      ? (row.tableRows as StorefrontWebpage["tableRows"])
      : [],
    blockquoteMainTitle: String(row.blockquoteMainTitle || ""),
    blockquoteLeftTitle: String(row.blockquoteLeftTitle || ""),
    blockquoteDescription: String(row.blockquoteDescription || ""),
    blockquoteTags: Array.isArray(row.blockquoteTags)
      ? row.blockquoteTags.map((t) => String(t || ""))
      : [],
    accordionTags: Array.isArray(row.accordionTags)
      ? (row.accordionTags as StorefrontWebpage["accordionTags"])
      : [],
    advertisements: Array.isArray(row.advertisements)
      ? (row.advertisements as StorefrontWebpage["advertisements"])
      : [],
    advertisementUrl: String(row.advertisementUrl || ""),
    sideThumbName: String(row.sideThumbName || ""),
    sideThumbDesignation: String(row.sideThumbDesignation || ""),
    sideThumbDescription: String(row.sideThumbDescription || ""),
    facebookUrl: String(row.facebookUrl || ""),
    youtubeUrl: String(row.youtubeUrl || ""),
    instaUrl: String(row.instaUrl || ""),
    googleUrl: String(row.googleUrl || ""),
    imageGallery: Array.isArray(row.imageGallery)
      ? row.imageGallery
          .map(mapImage)
          .filter((x): x is { url: string; key: string } => !!x)
      : [],
    notices: Array.isArray(row.notices)
      ? (row.notices as StorefrontWebpage["notices"])
      : [],
    searchLocations: Array.isArray(row.searchLocations)
      ? (row.searchLocations as StorefrontWebpage["searchLocations"])
      : [],
    design5Chip: String(row.design5Chip || ""),
    design5MainHeading: String(row.design5MainHeading || ""),
    gridCards: Array.isArray(row.gridCards)
      ? (row.gridCards as StorefrontWebpage["gridCards"])
      : [],
    design6Chip: String(row.design6Chip || ""),
    design6ExploreLink: String(row.design6ExploreLink || ""),
    design6MainHeading: String(row.design6MainHeading || ""),
    design6SubHeading: String(row.design6SubHeading || ""),
    design6Author: String(row.design6Author || ""),
    design6MidHeading: String(row.design6MidHeading || ""),
    design6MidLink: String(row.design6MidLink || ""),
    teamCards: Array.isArray(row.teamCards)
      ? (row.teamCards as StorefrontWebpage["teamCards"])
      : [],
    design7Chip: String(row.design7Chip || ""),
    design7ExploreLink: String(row.design7ExploreLink || ""),
    design7MainHeading: String(row.design7MainHeading || ""),
    design9MiniHeading: String(row.design9MiniHeading || ""),
    design9MainHeading: String(row.design9MainHeading || ""),
    design9Description: String(row.design9Description || ""),
    design9Cards: Array.isArray(row.design9Cards)
      ? (row.design9Cards as StorefrontWebpage["design9Cards"])
      : [],
    createdAt: typeof row.createdAt === "string" ? row.createdAt : undefined,
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : undefined,
  };
}

/**
 * Public webpage by slug for the .in storefront.
 * Returns null on 404; does not invent fallback marketing content.
 */
export const getWebpageBySlug = cache(
  async (slug: string): Promise<StorefrontWebpage | null> => {
    const base = apiBaseUrl();
    if (!base) return null;

    try {
      const response = await fetch(
        `${base}/sites/${STOREFRONT_SITE_CODE}/webpages/by-slug/${encodeURIComponent(slug)}`,
        {
          next: { revalidate: 60, tags: ["webpages", "IN", `webpage:${slug}`] },
          headers: { Accept: "application/json" },
        },
      );

      if (response.status === 404) return null;
      if (!response.ok) return null;

      const payload = (await response.json()) as ApiSuccess<
        Record<string, unknown>
      >;
      if (!payload?.success || !payload.data?.slug) return null;
      return mapWebpage(payload.data);
    } catch {
      return null;
    }
  },
);

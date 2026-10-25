import { cache } from "react";

import { FALLBACK_HERO_SLIDES } from "@/features/hero-banner/hero-banner.defaults";
import type { HeroBannerConfig, StorefrontHeroSlide } from "@/types/hero-banner";

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

function optionalHref(url: string | undefined, fallback = "#"): string {
  const trimmed = url?.trim();
  if (!trimmed || trimmed === "#") return fallback;
  return trimmed;
}

function preferHttps(url: string): string {
  if (url.startsWith("http://res.cloudinary.com/")) {
    return `https://${url.slice("http://".length)}`;
  }
  return url;
}

function isRenderableStorefrontSlide(slide: HeroBannerConfig["slides"][number]): boolean {
  if (!slide.active) return false;

  if (slide.layoutType === "FULL_WIDTH") {
    return Boolean(slide.mobileImageUrl.trim() || slide.desktopImageUrl.trim());
  }

  if (slide.layoutType === "SPLIT_DUAL") {
    return Boolean(
      slide.mainHeading.trim() && (slide.leftImageUrl.trim() || slide.rightImageUrl.trim()),
    );
  }

  return (
    Boolean(slide.mainHeading.trim()) &&
    (slide.gridImages || []).filter((image) => image.imageUrl.trim()).length >= 4
  );
}

export function mapHeroBannerConfigToStorefront(config: HeroBannerConfig): StorefrontHeroSlide[] {
  const slides = (config.slides || []).filter(isRenderableStorefrontSlide).map((slide) => ({
    id: slide.id,
    layoutType: slide.layoutType,
    miniHeading: slide.miniHeading.trim(),
    mainHeading: slide.mainHeading.trim(),
    description: slide.description.trim(),
    buttonLabel: slide.buttonLabel.trim(),
    buttonUrl:
      slide.layoutType === "FULL_WIDTH"
        ? optionalHref(slide.buttonUrl, "")
        : optionalHref(slide.buttonUrl, "/category"),
    button2Label: slide.button2Label.trim(),
    button2Url: optionalHref(slide.button2Url, "/category"),
    mobileImageUrl: preferHttps(slide.mobileImageUrl.trim()),
    desktopImageUrl: preferHttps(slide.desktopImageUrl.trim()),
    leftImageUrl: preferHttps(slide.leftImageUrl.trim()),
    leftImageClickUrl: optionalHref(slide.leftImageClickUrl, ""),
    rightImageUrl: preferHttps(slide.rightImageUrl.trim()),
    rightImageClickUrl: optionalHref(slide.rightImageClickUrl, ""),
    gridImages: (slide.gridImages || []).map((image) => ({
      id: image.id,
      src: preferHttps(image.imageUrl.trim()),
      alt: image.alt.trim() || slide.mainHeading.trim() || "Brand",
    })),
  }));

  return slides.length > 0 ? slides : FALLBACK_HERO_SLIDES;
}

/**
 * Server-side fetch of hero banners for the .in storefront.
 * Cached per request via React `cache`. Falls back to static landing data.
 */
export const getHeroBanners = cache(async (): Promise<StorefrontHeroSlide[]> => {
  const base = apiBaseUrl();
  if (!base) {
    return FALLBACK_HERO_SLIDES;
  }

  try {
    const response = await fetch(`${base}/sites/${STOREFRONT_SITE_CODE}/hero-banners`, {
      next: { revalidate: 60, tags: ["hero-banners", "IN"] },
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return FALLBACK_HERO_SLIDES;
    }

    const payload = (await response.json()) as ApiSuccess<HeroBannerConfig>;
    if (!payload?.success || !payload.data) {
      return FALLBACK_HERO_SLIDES;
    }

    if (!payload.data.slides?.length) {
      return FALLBACK_HERO_SLIDES;
    }

    return mapHeroBannerConfigToStorefront(payload.data);
  } catch {
    return FALLBACK_HERO_SLIDES;
  }
});

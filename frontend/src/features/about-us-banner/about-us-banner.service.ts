import { cache } from "react";

import { FALLBACK_ABOUT_US_BANNER } from "@/features/about-us-banner/about-us-banner.defaults";
import type {
  AboutUsBannerConfig,
  StorefrontAboutUsBanner,
} from "@/types/about-us-banner";

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

export function mapAboutUsBannerConfigToStorefront(
  config: AboutUsBannerConfig,
): StorefrontAboutUsBanner {
  const promoHeading = config.promoHeading.trim();
  const promo: StorefrontAboutUsBanner["promo"] =
    promoHeading.length > 0
      ? {
          label: config.promoLabel.trim() || FALLBACK_ABOUT_US_BANNER.promo.label,
          title: promoHeading,
          subtitle:
            config.promoSubheading.trim() ||
            FALLBACK_ABOUT_US_BANNER.promo.subtitle,
          cta: {
            label:
              config.promoButtonLabel.trim() ||
              FALLBACK_ABOUT_US_BANNER.promo.cta.label,
            href: optionalHref(
              config.promoButtonUrl,
              FALLBACK_ABOUT_US_BANNER.promo.cta.href,
            ),
          },
        }
      : FALLBACK_ABOUT_US_BANNER.promo;

  const aboutCards = (config.aboutCards || [])
    .filter((card) => card.active && card.heading.trim())
    .map((card) => ({
      id: card.id,
      label: card.label.trim() || "About us",
      title: card.heading.trim(),
      body: card.description.trim(),
      cta: {
        label: card.buttonLabel.trim() || "Read more",
        href: optionalHref(card.buttonUrl, "/about"),
      },
      image: {
        src:
          preferHttps(card.imageUrl.trim()) ||
          FALLBACK_ABOUT_US_BANNER.aboutCards[0]!.image.src,
        alt: card.heading.trim() || "About us",
      },
    }));

  const highlightItems = (config.highlightItems || [])
    .filter((item) => item.active && item.heading.trim())
    .map((item) => ({
      id: item.id,
      title: item.heading.trim(),
      image:
        preferHttps(item.imageUrl.trim()) ||
        FALLBACK_ABOUT_US_BANNER.highlightItems[0]!.image,
      alt: item.heading.trim(),
      href: optionalHref(item.buttonUrl, "#"),
      buttonLabel: item.buttonLabel.trim() || "Read more",
    }));

  const textSlides = (config.textSlides || [])
    .filter((slide) => slide.active && slide.heading.trim())
    .map((slide) => ({
      id: slide.id,
      title: slide.heading.trim(),
      body: slide.subheading.trim(),
    }));

  return {
    promo,
    aboutCards:
      aboutCards.length > 0 ? aboutCards : FALLBACK_ABOUT_US_BANNER.aboutCards,
    highlightItems:
      highlightItems.length > 0
        ? highlightItems
        : FALLBACK_ABOUT_US_BANNER.highlightItems,
    textSlides:
      textSlides.length > 0 ? textSlides : FALLBACK_ABOUT_US_BANNER.textSlides,
  };
}

/**
 * Server-side fetch of About Us banner for the .in storefront.
 * Cached per request via React `cache`. Falls back to static landing data.
 */
export const getAboutUsBanner = cache(
  async (): Promise<StorefrontAboutUsBanner> => {
    const base = apiBaseUrl();
    if (!base) {
      return FALLBACK_ABOUT_US_BANNER;
    }

    try {
      const response = await fetch(
        `${base}/sites/${STOREFRONT_SITE_CODE}/about-us-banner`,
        {
          next: { revalidate: 60, tags: ["about-us-banner", "IN"] },
          headers: { Accept: "application/json" },
        },
      );

      if (!response.ok) {
        return FALLBACK_ABOUT_US_BANNER;
      }

      const payload =
        (await response.json()) as ApiSuccess<AboutUsBannerConfig>;
      if (!payload?.success || !payload.data) {
        return FALLBACK_ABOUT_US_BANNER;
      }

      if (!payload.data.id) {
        return FALLBACK_ABOUT_US_BANNER;
      }

      return mapAboutUsBannerConfigToStorefront(payload.data);
    } catch {
      return FALLBACK_ABOUT_US_BANNER;
    }
  },
);

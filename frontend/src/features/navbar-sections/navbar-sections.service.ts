import { cache } from "react";

import { FALLBACK_NAV_LINKS } from "@/features/navbar-sections/navbar-sections.defaults";
import type { NavbarSection, StorefrontNavLink } from "@/types/navbar-sections";

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

export function mapNavbarSectionsToNavLinks(sections: NavbarSection[]): StorefrontNavLink[] {
  return [...sections]
    .filter((section) => section.active)
    .sort((left, right) => (left.order || 0) - (right.order || 0))
    .map((section) => ({
      id: section.id,
      label: section.title,
      href: section.url || "#",
      description: section.description || "",
      menuHeading: section.menuHeading || section.title,
      menuDescription: section.menuDescription || "",
      children: [...(section.subSections || [])]
        .filter((sub) => sub.active)
        .sort((left, right) => (left.order || 0) - (right.order || 0))
        .map((sub) => ({
          id: sub.id,
          label: sub.title,
          href: sub.url || "#",
          description: sub.description || "",
        })),
    }));
}

/**
 * Server-side fetch of active navbar sections for the .in storefront.
 * Cached per request via React `cache`. Falls back to static landing links.
 */
export const getNavbarSections = cache(async (): Promise<StorefrontNavLink[]> => {
  const base = apiBaseUrl();
  if (!base) {
    return FALLBACK_NAV_LINKS;
  }

  try {
    const response = await fetch(`${base}/sites/${STOREFRONT_SITE_CODE}/navbar-sections`, {
      next: { revalidate: 60, tags: ["navbar-sections", "IN"] },
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return FALLBACK_NAV_LINKS;
    }

    const payload = (await response.json()) as ApiSuccess<NavbarSection[]>;
    if (!payload?.success || !Array.isArray(payload.data) || payload.data.length === 0) {
      return FALLBACK_NAV_LINKS;
    }

    const links = mapNavbarSectionsToNavLinks(payload.data);
    return links.length > 0 ? links : FALLBACK_NAV_LINKS;
  } catch {
    return FALLBACK_NAV_LINKS;
  }
});

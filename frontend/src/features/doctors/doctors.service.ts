import { cache } from "react";

import type { DoctorPageConfig, DoctorProfile } from "@/types/doctors";

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

export const emptyDoctorPageConfig = (): DoctorPageConfig => ({
  id: null,
  siteCode: STOREFRONT_SITE_CODE,
  aboutHeading: "",
  aboutDescription: "",
  aboutHighlights: [],
  aboutButtonLabel: "",
  aboutButtonUrl: "",
  aboutImageUrl: "",
  aboutImagePublicId: "",
  aboutSecondaryImageUrl: "",
  aboutSecondaryImagePublicId: "",
  experienceYears: null,
  servicesHeading: "",
  servicesSubheading: "",
  services: [],
});

/**
 * Server-side fetch of active doctor profiles for the .in storefront.
 */
export const getDoctorProfiles = cache(async (): Promise<DoctorProfile[]> => {
  const base = apiBaseUrl();
  if (!base) {
    return [];
  }

  try {
    const response = await fetch(
      `${base}/sites/${STOREFRONT_SITE_CODE}/doctors`,
      {
        next: { revalidate: 60, tags: ["doctors", "IN"] },
        headers: { Accept: "application/json" },
      },
    );

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as ApiSuccess<DoctorProfile[]>;
    if (!payload?.success || !Array.isArray(payload.data)) {
      return [];
    }

    return payload.data.filter(
      (item) => item.active && item.name && item.photoUrl && item.specialization,
    );
  } catch {
    return [];
  }
});

/**
 * Server-side fetch of doctors landing page config (about + services).
 */
export const getDoctorPageConfig = cache(async (): Promise<DoctorPageConfig> => {
  const base = apiBaseUrl();
  if (!base) {
    return emptyDoctorPageConfig();
  }

  try {
    const response = await fetch(
      `${base}/sites/${STOREFRONT_SITE_CODE}/doctor-page`,
      {
        next: { revalidate: 60, tags: ["doctor-page", "IN"] },
        headers: { Accept: "application/json" },
      },
    );

    if (!response.ok) {
      return emptyDoctorPageConfig();
    }

    const payload = (await response.json()) as ApiSuccess<DoctorPageConfig>;
    if (!payload?.success || !payload.data) {
      return emptyDoctorPageConfig();
    }

    return {
      ...emptyDoctorPageConfig(),
      ...payload.data,
      aboutHighlights: Array.isArray(payload.data.aboutHighlights)
        ? payload.data.aboutHighlights
        : [],
      services: Array.isArray(payload.data.services)
        ? payload.data.services.filter((service) => service.active)
        : [],
    };
  } catch {
    return emptyDoctorPageConfig();
  }
});

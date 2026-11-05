import { cache } from "react";

import type {
  DoctorPageConfig,
  DoctorProfile,
  DoctorProfileFacets,
} from "@/types/doctors";

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

const STOREFRONT_SITE_CODE = "IN" as const;

export const emptyDoctorProfileFacets = (): DoctorProfileFacets => ({
  specialities: [],
  states: [],
  citiesByState: {},
});

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

    return payload.data
      .map((item) => ({
        ...item,
        specializations: Array.isArray(item.specializations)
          ? item.specializations.filter(Boolean)
          : [],
        phone: item.phone ?? "",
        email: item.email ?? "",
        location: item.location ?? "",
        education: item.education ?? "",
        degree: item.degree ?? "",
        workHistory: item.workHistory ?? "",
        workDays: item.workDays ?? "",
      }))
      .filter(
        (item) =>
          item.active && item.name && item.photoUrl && item.specializations.length > 0,
      );
  } catch {
    return [];
  }
});

/**
 * Server-side fetch of distinct speciality / state / city filter options.
 */
export const getDoctorProfileFacets = cache(
  async (): Promise<DoctorProfileFacets> => {
    const base = apiBaseUrl();
    if (!base) {
      return emptyDoctorProfileFacets();
    }

    try {
      const response = await fetch(
        `${base}/sites/${STOREFRONT_SITE_CODE}/doctors/facets`,
        {
          next: { revalidate: 60, tags: ["doctors", "doctors-facets", "IN"] },
          headers: { Accept: "application/json" },
        },
      );

      if (!response.ok) {
        return emptyDoctorProfileFacets();
      }

      const payload = (await response.json()) as ApiSuccess<DoctorProfileFacets>;
      if (!payload?.success || !payload.data) {
        return emptyDoctorProfileFacets();
      }

      return {
        specialities: Array.isArray(payload.data.specialities)
          ? payload.data.specialities.filter(Boolean)
          : [],
        states: Array.isArray(payload.data.states)
          ? payload.data.states.filter(Boolean)
          : [],
        citiesByState:
          payload.data.citiesByState &&
          typeof payload.data.citiesByState === "object"
            ? Object.fromEntries(
                Object.entries(payload.data.citiesByState).map(
                  ([state, cities]) => [
                    state,
                    Array.isArray(cities) ? cities.filter(Boolean) : [],
                  ],
                ),
              )
            : {},
      };
    } catch {
      return emptyDoctorProfileFacets();
    }
  },
);

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

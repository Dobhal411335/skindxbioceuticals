import { cache } from "react";

import { FALLBACK_COMPANY_BASIC_INFO } from "@/features/company-basic-info/company-basic-info.defaults";
import type { CompanyBasicInfo } from "@/types/company-basic-info";

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
 * Server-side fetch of site-scoped company profile for the .in storefront.
 * Cached per request via React `cache`.
 */
export const getCompanyBasicInfo = cache(async (): Promise<CompanyBasicInfo> => {
  const base = apiBaseUrl();
  if (!base) {
    return FALLBACK_COMPANY_BASIC_INFO;
  }

  try {
    const response = await fetch(
      `${base}/sites/${STOREFRONT_SITE_CODE}/company-basic-info`,
      {
        next: { revalidate: 60, tags: ["company-basic-info", "IN"] },
        headers: { Accept: "application/json" },
      },
    );

    if (!response.ok) {
      return FALLBACK_COMPANY_BASIC_INFO;
    }

    const payload = (await response.json()) as ApiSuccess<CompanyBasicInfo>;
    if (!payload?.success || !payload.data) {
      return FALLBACK_COMPANY_BASIC_INFO;
    }

    return {
      ...FALLBACK_COMPANY_BASIC_INFO,
      ...payload.data,
      mainLogo: payload.data.mainLogo ?? FALLBACK_COMPANY_BASIC_INFO.mainLogo,
      footerLogo: payload.data.footerLogo ?? FALLBACK_COMPANY_BASIC_INFO.footerLogo,
      mobileUiLogo:
        payload.data.mobileUiLogo ?? FALLBACK_COMPANY_BASIC_INFO.mobileUiLogo,
    };
  } catch {
    return FALLBACK_COMPANY_BASIC_INFO;
  }
});

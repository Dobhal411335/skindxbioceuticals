import type { Metadata } from "next";

import { FALLBACK_COMPANY_BASIC_INFO } from "@/features/company-basic-info/company-basic-info.defaults";
import type { CompanyBasicInfo } from "@/types/company-basic-info";

function normalizeSiteUrl(domainName: string): string | undefined {
  const value = String(domainName || "").trim();
  if (!value) return undefined;

  if (/^https?:\/\//i.test(value)) {
    return value.replace(/\/$/, "");
  }

  return `https://${value.replace(/\/$/, "")}`;
}

/**
 * Builds Next.js Metadata from company basic info (title, OG, Twitter).
 * Does not invent medical claims or product outcomes.
 */
export function buildCompanyMetadata(company: CompanyBasicInfo | null): Metadata {
  const siteName =
    company?.companyName?.trim() || FALLBACK_COMPANY_BASIC_INFO.companyName;
  const title =
    company?.titleTagForMainLandingPage?.trim() ||
    FALLBACK_COMPANY_BASIC_INFO.titleTagForMainLandingPage;
  const keywords =
    company?.keywords?.length && company.keywords.length > 0
      ? company.keywords
      : undefined;
  const siteUrl = normalizeSiteUrl(company?.companyDomainName ?? "");
  const ogImage = company?.mainLogo?.url?.trim() || undefined;

  const metadata: Metadata = {
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description:
      "SkinDX Bioceuticals — skincare and biomedical ecommerce storefront for India.",
    ...(keywords ? { keywords } : {}),
    openGraph: {
      title,
      description:
        "SkinDX Bioceuticals — skincare and biomedical ecommerce storefront for India.",
      siteName,
      type: "website",
      ...(siteUrl ? { url: siteUrl } : {}),
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description:
        "SkinDX Bioceuticals — skincare and biomedical ecommerce storefront for India.",
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };

  if (siteUrl) {
    try {
      metadata.metadataBase = new URL(siteUrl);
    } catch {
      // ignore invalid domain
    }
  }

  return metadata;
}

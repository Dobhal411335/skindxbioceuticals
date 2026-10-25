import { cache } from "react";
import type {
  ClinicalConfidenceConfig,
  StorefrontClinicalConfidence,
} from "@/types/clinical-confidence";

type ApiSuccess<T> = { success: true; message: string; data: T };
const siteCode = "IN" as const;

function apiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") || "";
}

function preferHttps(url: string) {
  return url.startsWith("http://res.cloudinary.com/") ? `https://${url.slice(7)}` : url;
}

export const FALLBACK_CLINICAL_CONFIDENCE: StorefrontClinicalConfidence = {
  id: null,
  siteCode,
  badgeText: "Science-inspired skincare",
  heading: "Care for Your Skin. Confidence in Every Day.",
  description:
    "Scientifically validated dermatological formulations and medical-grade solutions engineered specifically for barrier repair, photoprotection, and clinical efficacy in daily regimens.",
  button1Label: "Shop Skincare",
  button1Url: "/category",
  button2Label: "Explore Products",
  button2Url: "/products",
  backgroundImageUrl: "",
  backgroundImagePublicId: "",
  cards: [
    {
      id: "doctor",
      imageUrl: "https://placehold.co/600x700/png?text=Doctor",
      imagePublicId: "",
      heading: "Doctor-led formulation",
      description:
        "Validated by clinical practitioners across leading dermatology centres in India.",
      buttonLabel: "Meet our experts",
      buttonUrl: "/doctors",
      sortOrder: 0,
      active: true,
    },
    {
      id: "lab",
      imageUrl: "https://placehold.co/600x700/png?text=Laboratory",
      imagePublicId: "",
      heading: "Efficacy index",
      description:
        "Triple-filtered active molecules with clinically documented transdermal absorption rates.",
      buttonLabel: "Explore science",
      buttonUrl: "/about",
      sortOrder: 1,
      active: true,
    },
  ],
  updatedAt: null,
};

export function mapClinicalConfidenceToStorefront(
  config: ClinicalConfidenceConfig,
): StorefrontClinicalConfidence {
  return {
    ...config,
    backgroundImageUrl: preferHttps(config.backgroundImageUrl.trim()),
    cards: (config.cards || [])
      .filter((card) => card.active && card.heading.trim())
      .map((card) => ({
        ...card,
        imageUrl: preferHttps(card.imageUrl.trim()),
        heading: card.heading.trim(),
        description: card.description.trim(),
      })),
  };
}

export const getClinicalConfidence = cache(async (): Promise<StorefrontClinicalConfidence> => {
  const base = apiBaseUrl();
  if (!base) return FALLBACK_CLINICAL_CONFIDENCE;
  try {
    const response = await fetch(`${base}/sites/${siteCode}/clinical-confidence`, {
      next: { revalidate: 60, tags: ["clinical-confidence", siteCode] },
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return FALLBACK_CLINICAL_CONFIDENCE;
    const payload = (await response.json()) as ApiSuccess<ClinicalConfidenceConfig>;
    if (!payload?.success || !payload.data) return FALLBACK_CLINICAL_CONFIDENCE;
    const mapped = mapClinicalConfidenceToStorefront(payload.data);
    return mapped.cards.length > 0 ? mapped : FALLBACK_CLINICAL_CONFIDENCE;
  } catch {
    return FALLBACK_CLINICAL_CONFIDENCE;
  }
});

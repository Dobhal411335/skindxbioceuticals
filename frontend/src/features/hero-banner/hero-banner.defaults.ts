import {
  hero,
  heroAssociateFallback,
} from "@/data/landing";
import type { StorefrontHeroSlide } from "@/types/hero-banner";

/** Static fallback slides when the API returns no active hero banners. */
export const FALLBACK_HERO_SLIDES: StorefrontHeroSlide[] = [
  {
    id: "fallback-multi",
    layoutType: "MULTI_IMAGE",
    miniHeading: "",
    mainHeading: heroAssociateFallback.title,
    description: heroAssociateFallback.body,
    buttonLabel: heroAssociateFallback.cta.label,
    buttonUrl: heroAssociateFallback.cta.href,
    button2Label: "",
    button2Url: "",
    mobileImageUrl: "",
    desktopImageUrl: "",
    leftImageUrl: "",
    rightImageUrl: "",
    gridImages: heroAssociateFallback.partners.map((partner) => ({
      id: partner.id,
      src: "",
      alt: partner.name,
    })),
  },
  {
    id: "fallback-split",
    layoutType: "SPLIT_DUAL",
    miniHeading: hero.eyebrow,
    mainHeading: hero.title,
    description: hero.body,
    buttonLabel: hero.primaryCta.label,
    buttonUrl: hero.primaryCta.href,
    button2Label: hero.secondaryCta.label,
    button2Url: hero.secondaryCta.href,
    mobileImageUrl: hero.rightImage.src,
    desktopImageUrl: hero.rightImage.src,
    leftImageUrl: hero.leftImage.src,
    rightImageUrl: hero.rightImage.src,
    gridImages: [],
  },
];

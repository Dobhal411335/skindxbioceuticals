import { promos } from "@/data/landing";
import type { StorefrontPromoBanner } from "@/types/promo-banner";

export const FALLBACK_PROMO_BANNERS: StorefrontPromoBanner[] = promos.map(
  (promo) => ({
    id: promo.id,
    imageUrl: promo.image,
    miniHeading: "",
    heading: promo.title,
    buttonLabel: "Explore",
    href: promo.href,
    alt: promo.alt || promo.title,
  }),
);

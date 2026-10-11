import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { StorefrontPromoHeader } from "@/types/about-us-banner";
import { FALLBACK_ABOUT_US_BANNER } from "@/features/about-us-banner/about-us-banner.defaults";

type SpecialsHeaderProps = {
  promo?: StorefrontPromoHeader;
};

export function SpecialsHeader({
  promo = FALLBACK_ABOUT_US_BANNER.promo,
}: SpecialsHeaderProps) {
  return (
    <section className="container-page section-space" aria-labelledby="specials-heading">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            {promo.label}
          </p>
          <h2
            id="specials-heading"
            className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            {promo.title}
          </h2>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            {promo.subtitle}
          </p>
        </div>
        <Link
          href={promo.cta.href}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:mt-1"
        >
          {promo.cta.label}
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

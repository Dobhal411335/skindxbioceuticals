import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { specials } from "@/data/landing";

export function SpecialsHeader() {
  return (
    <section className="container-page section-space" aria-labelledby="specials-heading">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {specials.label}
          </p>
          <h2
            id="specials-heading"
            className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            {specials.title}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            {specials.subtitle}
          </p>
        </div>
        <Link
          href={specials.cta.href}
          className="inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {specials.cta.label}
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

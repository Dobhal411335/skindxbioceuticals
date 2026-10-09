import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { promos } from "@/data/landing";
import { cn } from "@/lib/utils";

const toneClass = {
  warm: "bg-surface-warm text-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  surface: "bg-muted text-foreground",
} as const;

export function PromoBannerRow() {
  return (
    <section className="container-page pb-12 lg:pb-16" aria-label="Promotional banners">
      <div className="grid gap-4 md:grid-cols-3">
        {promos.map((promo) => (
          <article
            key={promo.id}
            className={cn(
              "relative flex min-h-[12rem] overflow-hidden rounded-2xl p-6",
              toneClass[promo.tone],
            )}
          >
            <div className="relative z-10 max-w-[60%]">
              <h3 className="font-display text-xl font-semibold">{promo.title}</h3>
              <p className="mt-2 text-sm opacity-90">{promo.description}</p>
              <Link
                href={promo.href}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Shop now
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
            <div className="absolute right-0 bottom-0 h-28 w-28 sm:h-32 sm:w-32">
              <Image
                src={promo.image}
                alt={promo.alt}
                fill
                className="object-contain object-bottom-right p-2"
                sizes="128px"
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

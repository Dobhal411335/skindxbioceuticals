import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { about } from "@/data/landing";

export function AboutSplit() {
  return (
    <section className="container-page section-space" aria-labelledby="about-heading">
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="relative aspect-[4/5] overflow-hidden bg-surface sm:aspect-[5/4] lg:aspect-[4/5]">
          <Image
            src={about.image.src}
            alt={about.image.alt}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
        <div className="max-w-xl lg:py-8">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {about.label}
          </p>
          <h2
            id="about-heading"
            className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            {about.title}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {about.body}
          </p>
          <Button asChild className="mt-8 rounded-full px-6" size="lg">
            <Link href={about.cta.href}>{about.cta.label}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

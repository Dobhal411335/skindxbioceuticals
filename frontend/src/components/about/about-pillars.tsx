import Image from "next/image";
import Link from "next/link";

import { aboutPage } from "@/data/about";

export function AboutPillars() {
  const { title, subtitle, items } = aboutPage.pillars;

  return (
    <section
      className="container-page section-space"
      aria-labelledby="about-pillars-heading"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2
          id="about-pillars-heading"
          className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          {title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {subtitle}
        </p>
      </div>

      <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {items.map((item) => (
          <li key={item.id} className="group text-center">
            <div className="relative mx-auto aspect-[3/4] overflow-hidden rounded-lg bg-surface">
              <Image
                src={item.image.src}
                alt={item.image.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            </div>
            <h3 className="mt-5 text-base font-semibold tracking-tight">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {item.description}
            </p>
            <Link
              href={item.href}
              className="mt-4 inline-block text-sm font-medium underline underline-offset-4 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {item.cta}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

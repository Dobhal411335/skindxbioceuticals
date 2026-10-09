import Image from "next/image";
import Link from "next/link";

import { aboutPage } from "@/data/about";

export function AboutBanner() {
  const { label, title, href, image } = aboutPage.banner;

  return (
    <section className="relative" aria-labelledby="about-banner-heading">
      <Link
        href={href}
        className="group relative block min-h-[16rem] overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-[20rem] lg:min-h-[24rem]"
      >
        <Image
          src={image.src}
          alt={image.alt}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-secondary/45" />
        <div className="container-page relative flex min-h-[16rem] items-center py-12 sm:min-h-[20rem] lg:min-h-[24rem]">
          <div className="max-w-lg text-secondary-foreground">
            <p className="text-xs font-semibold tracking-[0.2em] text-secondary-foreground/80 uppercase">
              {label}
            </p>
            <h2
              id="about-banner-heading"
              className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl"
            >
              {title}
            </h2>
          </div>
        </div>
      </Link>
    </section>
  );
}

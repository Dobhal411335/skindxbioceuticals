import Image from "next/image";

import { aboutPage } from "@/data/about";

export function AboutHero() {
  const { brand, title, body, signature, image } = aboutPage.hero;

  return (
    <section
      className="relative min-h-[28rem] overflow-hidden bg-secondary text-secondary-foreground sm:min-h-[32rem] lg:min-h-[36rem]"
      aria-labelledby="about-hero-heading"
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority
        className="object-cover object-[70%_center] opacity-90"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/85 to-secondary/25" />

      <div className="container-page relative flex min-h-[28rem] items-center py-16 sm:min-h-[32rem] lg:min-h-[36rem] lg:py-20">
        <div className="max-w-xl animate-[fade-up_0.7s_ease-out]">
          <p className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {brand}
          </p>
          <h1
            id="about-hero-heading"
            className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-tight"
          >
            {title}
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-secondary-foreground/90 sm:text-base">
            {body}
          </p>
          <p className="font-display mt-8 text-xl italic text-secondary-foreground/80">
            {signature}
          </p>
        </div>
      </div>
    </section>
  );
}

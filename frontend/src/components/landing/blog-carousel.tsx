"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { FALLBACK_ABOUT_US_BANNER } from "@/features/about-us-banner/about-us-banner.defaults";
import type {
  StorefrontHighlightItem,
  StorefrontTextSlide,
} from "@/types/about-us-banner";

type BlogCarouselProps = {
  highlightItems?: StorefrontHighlightItem[];
  textSlides?: StorefrontTextSlide[];
};

function HighlightCard({ item }: { item: StorefrontHighlightItem }) {
  return (
    <article className="h-full overflow-hidden border border-border bg-background">
      <Link
        href={item.href}
        className="group flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative aspect-[4/3] bg-surface">
          <Image
            src={item.image}
            alt={item.alt}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 85vw, 33vw"
          />
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <h3 className="font-display text-lg leading-snug font-semibold group-hover:text-primary">
            {item.title}
          </h3>
          <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium underline-offset-4 group-hover:underline">
            {item.buttonLabel}
            <ArrowRight className="size-3.5" aria-hidden />
          </span>
        </div>
      </Link>
    </article>
  );
}

function TextSlidesBlock({ slides }: { slides: StorefrontTextSlide[] }) {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelected(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (slides.length === 1) {
    const slide = slides[0]!;
    return (
      <div className="max-w-md">
        <h2
          id="blog-rail-heading"
          className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          {slide.title}
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {slide.body}
        </p>
      </div>
    );
  }

  return (
    <div className="relative max-w-md">
      <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
        <CarouselContent>
          {slides.map((slide) => (
            <CarouselItem key={slide.id}>
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                {slide.title}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {slide.body}
              </p>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div
        className="absolute top-0 -right-4 hidden h-full flex-col items-center justify-center gap-2 lg:flex"
        aria-hidden
      >
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            className={`h-8 w-0.5 rounded-full transition-colors ${
              index === selected ? "bg-foreground" : "bg-border"
            }`}
            onClick={() => api?.scrollTo(index)}
            aria-label={`Show text slide ${index + 1}`}
          />
        ))}
      </div>
      <h2 id="blog-rail-heading" className="sr-only">
        {slides[selected]?.title ?? "Highlights"}
      </h2>
    </div>
  );
}

export function BlogCarousel({
  highlightItems = FALLBACK_ABOUT_US_BANNER.highlightItems,
  textSlides = FALLBACK_ABOUT_US_BANNER.textSlides,
}: BlogCarouselProps) {
  return (
    <section className="container-page section-space" aria-labelledby="blog-rail-heading">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-center">
        <div className="relative">
          <Carousel opts={{ align: "start", loop: true }} className="w-full">
            <CarouselContent className="-ml-3">
              {highlightItems.map((item) => (
                <CarouselItem
                  key={item.id}
                  className="basis-[85%] pl-3 sm:basis-1/2 xl:basis-1/3"
                >
                  <HighlightCard item={item} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-3 hidden border-border bg-background/90 text-foreground shadow-sm sm:flex" />
            <CarouselNext className="-right-3 hidden border-border bg-background/90 text-foreground shadow-sm sm:flex" />
          </Carousel>
        </div>

        <TextSlidesBlock slides={textSlides} />
      </div>
    </section>
  );
}

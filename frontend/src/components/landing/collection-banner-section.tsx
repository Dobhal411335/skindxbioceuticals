"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import type { StorefrontCollectionBanner } from "@/types/collection-banner";

type CollectionBannerSectionProps = {
  banner: StorefrontCollectionBanner;
};

function SlideMedia({
  imageUrl,
  alt,
  href,
}: {
  imageUrl: string;
  alt: string;
  href: string;
}) {
  const media = imageUrl ? (
    <Image
      src={imageUrl}
      alt={alt}
      fill
      className="object-cover"
      sizes="(max-width: 1024px) 100vw, 55vw"
      priority={false}
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
      {alt}
    </div>
  );

  if (!href) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted sm:aspect-[5/4]">
        {media}
      </div>
    );
  }

  const isExternal = /^https?:\/\//i.test(href);
  const className =
    "relative block aspect-[4/3] w-full overflow-hidden bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:aspect-[5/4]";

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {media}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {media}
    </Link>
  );
}

export function CollectionBannerSection({
  banner,
}: CollectionBannerSectionProps) {
  const items = banner.items;
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setActiveIndex(api.selectedScrollSnap());
    };

    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  if (items.length === 0) {
    return null;
  }

  const selectSlide = (index: number) => {
    setActiveIndex(index);
    api?.scrollTo(index);
  };

  return (
    <section
      className="container-page section-space"
      aria-labelledby="collection-banner-heading"
    >
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16 overflow-hidden">
        <div className="relative bg-surface rounded-xl border border-black">
          <Carousel
            setApi={setApi}
            opts={{ loop: items.length > 1, align: "start" }}
            className="w-full overflow-hidden rounded-xl"
          >
            <CarouselContent>
              {items.map((item) => (
                <CarouselItem key={item.id}>
                  <SlideMedia
                    imageUrl={item.imageUrl}
                    alt={item.alt}
                    href={item.href}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        <div className="lg:pt-4">
          <p className="text-md font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            {banner.sectionLabel}
          </p>
          <h2
            id="collection-banner-heading"
            className="mt-3 max-w-md text-4xl font-semibold tracking-tight text-foreground"
          >
            {banner.sectionHeading}
          </h2>

          <div className="relative mt-10">
            <div
              className="absolute top-1 bottom-1 left-0 w-px bg-border"
              aria-hidden
            />

            <ul className="space-y-6">
              {items.map((item, index) => {
                const isActive = index === activeIndex;
                return (
                  <li key={item.id} className="relative pl-5">
                    <span
                      className={cn(
                        "absolute top-1 left-0 w-0.75 rounded-full bg-foreground transition-all duration-300",
                        isActive ? "h-5 opacity-100" : "h-0 opacity-0",
                      )}
                      aria-hidden
                    />
                    <button
                      type="button"
                      onClick={() => selectSlide(index)}
                      className={cn(
                        "w-full text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground/70 hover:text-muted-foreground",
                      )}
                      aria-current={isActive ? "true" : undefined}
                    >
                      <span
                        className={cn(
                          "text-2xl tracking-tight",
                          isActive ? "font-semibold" : "font-normal",
                        )}
                      >
                        {item.title}
                      </span>
                      <span
                        className={cn(
                          "mt-2 block overflow-hidden text-sm leading-relaxed line-clamp-2 text-ellipsis text-muted-foreground transition-all duration-300",
                          isActive
                            ? "max-h-40 opacity-100"
                            : "max-h-0 opacity-0",
                        )}
                      >
                        {item.description}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { FALLBACK_PROMO_BANNERS } from "@/features/promo-banner/promo-banner.defaults";
import type { StorefrontPromoBanner } from "@/types/promo-banner";

type PromoBannerRowProps = {
  items?: StorefrontPromoBanner[];
};

function PromoCta({ href, label }: { href: string; label: string }) {
  const isExternal = /^https?:\/\//i.test(href);
  const classes =
    "mt-1 inline-flex w-fit items-center rounded-full bg-background px-5 py-2 text-xs font-semibold tracking-wide text-secondary transition-colors hover:bg-background/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
      >
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {label}
    </Link>
  );
}

function PromoTile({ item }: { item: StorefrontPromoBanner }) {
  const showCta = Boolean(item.buttonLabel && item.href);

  return (
    <article className="group relative flex h-full min-h-[11.5rem] overflow-hidden rounded-2xl bg-muted sm:min-h-[13rem] border border-black">
      <Image
        src={item.imageUrl}
        alt={item.alt}
        fill
        className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, 33vw"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/20 to-transparent"
      />
      <div className="relative z-10 flex max-w-[70%] flex-col justify-center gap-2.5 p-5 text-white sm:max-w-[60%] sm:gap-3 sm:p-6">
        {item.miniHeading ? (
          <p className="text-[10px] font-semibold tracking-[0.16em] text-white/85 uppercase sm:text-[11px]">
            {item.miniHeading}
          </p>
        ) : null}
        {item.heading ? (
          <h3 className="font-display text-xl leading-snug font-semibold sm:text-2xl lg:text-[1.65rem]">
            {item.heading}
          </h3>
        ) : null}
        {showCta ? (
          <PromoCta href={item.href} label={item.buttonLabel} />
        ) : item.buttonLabel ? (
          <span className="mt-1 inline-flex w-fit items-center rounded-full bg-background px-5 py-2 text-xs font-semibold tracking-wide text-secondary">
            {item.buttonLabel}
          </span>
        ) : null}
      </div>
    </article>
  );
}

export function PromoBannerRow({
  items = FALLBACK_PROMO_BANNERS,
}: PromoBannerRowProps) {
  if (items.length === 0) {
    return null;
  }

  const showControls = items.length > 3;

  return (
    <section
      className="container-page py-12 lg:py-16"
      aria-label="Promotional banners"
    >
      <Carousel
        opts={{ align: "start", loop: showControls }}
        className="w-full"
      >
        {showControls ? (
          <div className="mb-4 flex justify-end gap-2">
            <CarouselPrevious className="static inset-auto size-8 translate-y-0 border-border bg-background/90 text-foreground shadow-sm" />
            <CarouselNext className="static inset-auto size-8 translate-y-0 border-border bg-background/90 text-foreground shadow-sm" />
          </div>
        ) : null}

        <CarouselContent className="-ml-4">
          {items.map((item) => (
            <CarouselItem
              key={item.id}
              className="basis-full pl-4 sm:basis-1/2 lg:basis-1/3"
            >
              <PromoTile item={item} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}

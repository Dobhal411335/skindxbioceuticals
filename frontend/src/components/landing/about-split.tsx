"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { FALLBACK_ABOUT_US_BANNER } from "@/features/about-us-banner/about-us-banner.defaults";
import { useCarouselAutoplay } from "@/hooks/useCarouselAutoplay";
import type { StorefrontAboutCard } from "@/types/about-us-banner";
import { ArrowUpRight  } from "lucide-react";

type AboutSplitProps = {
  cards?: StorefrontAboutCard[];
};

function AboutCardContent({ card }: { card: StorefrontAboutCard }) {
  return (
    <div className="grid items-stretch gap-0 overflow-hidden border border-border bg-background lg:grid-cols-2">
      <div className="relative aspect-[4/5] bg-surface sm:aspect-[5/4] lg:aspect-auto lg:min-h-[28rem]">
        <Image
          src={card.image.src}
          alt={card.image.alt}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>
      <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
        <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          {card.label}
        </p>
        <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {card.title}
        </h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          {card.body}
        </p>
        <Button asChild className="mt-8 w-fit rounded-full p-6 hover:px-10 hover:bg-primary" size="lg">
          <Link href={card.cta.href}>{card.cta.label} <ArrowUpRight className="h-4 w-4" /></Link>
        </Button>
      </div>
    </div>
  );
}

export function AboutSplit({
  cards = FALLBACK_ABOUT_US_BANNER.aboutCards,
}: AboutSplitProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelected(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  useCarouselAutoplay(api, {
    enabled: cards.length > 1,
    paused: isPaused,
  });

  if (cards.length === 0) {
    return null;
  }

  if (cards.length === 1) {
    return (
      <section className="container-page section-space" aria-labelledby="about-heading">
        <h2 id="about-heading" className="sr-only">
          {cards[0]!.title}
        </h2>
        <AboutCardContent card={cards[0]!} />
      </section>
    );
  }

  return (
    <section className="container-page section-space" aria-labelledby="about-heading">
      <h2 id="about-heading" className="sr-only">
        About us
      </h2>
      <div
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsPaused(false);
          }
        }}
      >
        <Carousel setApi={setApi} opts={{ loop: true, align: "start" }} className="w-full">
          <CarouselContent>
            {cards.map((card) => (
              <CarouselItem key={card.id}>
                <AboutCardContent card={card} />
              </CarouselItem>
            ))}
          </CarouselContent>
          {/* <CarouselPrevious className="left-2 border-border bg-background/90 text-foreground shadow-sm sm:left-3" />
          <CarouselNext className="right-2 border-border bg-background/90 text-foreground shadow-sm sm:right-3" /> */}
        </Carousel>
        <div className="absolute top-1/2 right-2 hidden -translate-y-1/2 flex-col items-center gap-2 lg:flex">
          {cards.map((card, index) => (
            <button
              key={card.id}
              type="button"
              className={`h-8 w-0.5 rounded-full transition-colors ${
                index === selected ? "bg-foreground" : "bg-border"
              }`}
              onClick={() => api?.scrollTo(index)}
              aria-label={`Show about card ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

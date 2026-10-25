"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { FALLBACK_HERO_SLIDES } from "@/features/hero-banner/hero-banner.defaults";
import { useCarouselAutoplay } from "@/hooks/useCarouselAutoplay";
import type { StorefrontHeroSlide } from "@/types/hero-banner";

type HeroSectionProps = {
  slides?: StorefrontHeroSlide[];
};

/** Shared frame so every layout matches in the carousel (avoids white gaps). */
const HERO_FRAME =
  "h-[32rem] w-full overflow-hidden sm:h-[36rem] lg:h-[40rem]";

function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return isMobile;
}

function HeroClickable({
  href,
  className,
  children,
  ariaLabel,
}: {
  href?: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  const target = href?.trim();
  if (!target || target === "#") {
    return <div className={className}>{children}</div>;
  }

  const isExternal = /^https?:\/\//i.test(target);
  if (isExternal) {
    return (
      <a
        href={target}
        className={className}
        aria-label={ariaLabel}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={target} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

function FullWidthSlide({
  slide,
  priority,
}: {
  slide: StorefrontHeroSlide;
  priority?: boolean;
}) {
  const isMobile = useIsMobileViewport();
  const src =
    (isMobile ? slide.mobileImageUrl : slide.desktopImageUrl) ||
    slide.desktopImageUrl ||
    slide.mobileImageUrl;

  if (!src) return null;

  return (
    <HeroClickable
      href={slide.buttonUrl}
      className={`relative block ${HERO_FRAME}`}
      ariaLabel="Hero banner"
    >
      <Image
        src={src}
        alt=""
        fill
        className="object-cover"
        sizes="100vw"
        priority={priority}
      />
    </HeroClickable>
  );
}

function SplitCopy({ slide }: { slide: StorefrontHeroSlide }) {
  return (
    <>
      {slide.miniHeading ? (
        <p className="text-sm tracking-wide">{slide.miniHeading}</p>
      ) : null}
      <h1 className="font-bold mt-3 text-4xl tracking-tight sm:text-5xl">
        {slide.mainHeading}
      </h1>
      {slide.description ? (
        <p className="mt-4 max-w-md text-sm leading-relaxed opacity-90 ">
          {slide.description}
        </p>
      ) : null}
      <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
        {slide.buttonLabel ? (
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-white border-2 bg-primary-foreground text-primary hover:bg-transparent px-10 py-7 rounded hover:text-primary-foreground"
          >
            <Link href={slide.buttonUrl}>{slide.buttonLabel} <ArrowUpRight className="size-6 ml-2" /></Link>
          </Button>
        ) : null}
        {slide.button2Label ? (
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-white rounded border-2 bg-primary-foreground text-primary px-10 py-7 hover:bg-transparent hover:text-primary-foreground"
          >
            <Link href={slide.button2Url}>{slide.button2Label} <ArrowUpRight className="size-6" /></Link>
          </Button>
        ) : null}
      </div>
    </>
  );
}

function SplitDualSlide({
  slide,
  priority,
}: {
  slide: StorefrontHeroSlide;
  priority?: boolean;
}) {
  const isMobile = useIsMobileViewport();
  const mobileSrc = slide.leftImageUrl || slide.rightImageUrl;

  if (isMobile) {
    const mobileImageClickUrl = slide.leftImageUrl
      ? slide.leftImageClickUrl
      : slide.rightImageClickUrl;

    return (
      <div className={`relative ${HERO_FRAME}`}>
        {mobileSrc ? (
          <HeroClickable
            href={mobileImageClickUrl}
            className="absolute inset-0"
            ariaLabel="Open hero image"
          >
            <Image
              src={mobileSrc}
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
              priority={priority}
            />
          </HeroClickable>
        ) : null}
        <div className="pointer-events-none absolute inset-0 bg-primary/70" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 py-16 text-center text-primary-foreground">
          <SplitCopy slide={slide} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`grid ${HERO_FRAME} lg:grid-cols-[minmax(0,500px)_minmax(0,1fr)_minmax(0,500px)]`}
    >
      <div className="relative h-full min-h-0 bg-muted">
        {slide.leftImageUrl ? (
          <HeroClickable
            href={slide.leftImageClickUrl}
            className="relative block size-full"
            ariaLabel="Open left hero image"
          >
            <Image
              src={slide.leftImageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="350px"
              priority={priority}
            />
          </HeroClickable>
        ) : null}
      </div>

      <div className="flex h-full flex-col items-center justify-center bg-primary px-6 py-12 text-center text-primary-foreground">
        <SplitCopy slide={slide} />
      </div>

      <div className="relative h-full min-h-0 bg-muted">
        {slide.rightImageUrl ? (
          <HeroClickable
            href={slide.rightImageClickUrl}
            className="relative block size-full"
            ariaLabel="Open right hero image"
          >
            <Image
              src={slide.rightImageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="350px"
              priority={priority}
            />
          </HeroClickable>
        ) : null}
      </div>
    </div>
  );
}

function MultiImageSlide({ slide }: { slide: StorefrontHeroSlide }) {
  const images = slide.gridImages;
  const lastRowStart = images.length - (images.length % 2 === 0 ? 2 : 1);

  return (
    <div
      className={`relative flex ${HERO_FRAME} items-center justify-center border-b border-border bg-[#1a284f] text-white`}
    >
      <div className="container-page flex h-full w-full flex-col items-center justify-center gap-10 py-8 lg:flex-row lg:justify-between lg:gap-16">
        <div className="max-w-md text-center lg:text-left">
          <h2 className="text-5xl font-medium tracking-tight lowercase">
            {slide.mainHeading}
          </h2>
          {slide.description ? (
            <p className="mt-4 text-md leading-relaxed text-[#bccbe8]">
              {slide.description}
            </p>
          ) : null}
          {slide.buttonLabel ? (
            <Button
              asChild
              size="lg"
              className="mt-8 rounded border-transparent bg-[#ff6a00] px-8 py-6 text-white hover:bg-[#e55f00]"
            >
              <Link href={slide.buttonUrl}>{slide.buttonLabel} <ArrowUpRight className="size-4 ml-2" /></Link>
            </Button>
          ) : null}
        </div>

        <div
          className="grid grid-cols-2 gap-0"
          role="list"
          aria-label="Associate brands"
        >
          {images.map((image, index) => {
            const isLeftCol = index % 2 === 0;
            const isNotLastRow = index < lastRowStart;

            return (
              <div
                key={image.id}
                role="listitem"
                className={[
                  "relative h-[220px] w-[220px] overflow-hidden rounded-md",
                  isLeftCol ? "border-r border-white/70" : "",
                  isNotLastRow ? "border-b border-white/70" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {image.src ? (
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-contain p-3"
                    sizes="250px"
                  />
                ) : (
                  <span
                    className="flex size-full items-center justify-center text-sm font-bold tracking-wide text-foreground"
                    aria-hidden
                  >
                    {image.alt
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() || "SB"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HeroSlideView({
  slide,
  priority,
}: {
  slide: StorefrontHeroSlide;
  priority?: boolean;
}) {
  if (slide.layoutType === "FULL_WIDTH") {
    return <FullWidthSlide slide={slide} priority={priority} />;
  }
  if (slide.layoutType === "SPLIT_DUAL") {
    return <SplitDualSlide slide={slide} priority={priority} />;
  }
  return <MultiImageSlide slide={slide} />;
}

function HeroCarousel({ slides }: { slides: StorefrontHeroSlide[] }) {
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
    enabled: slides.length > 1,
    intervalMs: 6000,
    paused: isPaused,
  });

  if (slides.length === 1) {
    return <HeroSlideView slide={slides[0]!} priority />;
  }

  return (
    <div
      className="relative isolate"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsPaused(false);
        }
      }}
    >
      <Carousel
        setApi={setApi}
        opts={{ loop: true, align: "start" }}
        className="w-full"
      >
        <CarouselContent className="-ml-0">
          {slides.map((slide, index) => (
            <CarouselItem
              key={slide.id}
              className={`pl-0 basis-full ${HERO_FRAME}`}
            >
              <HeroSlideView slide={slide} priority={index === 0} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <Button
        type="button"
        size="icon"
        variant="outline"
        className="absolute top-1/2 left-2 z-20 size-12 -translate-y-1/2 rounded-full border-white/60 bg-black/35 text-white shadow-lg hover:bg-black/55 hover:text-white active:not-aria-[haspopup]:translate-y-0 sm:left-4 sm:size-14"
        onClick={() => api?.scrollPrev()}
        aria-label="Previous hero slide"
      >
        <ChevronLeft className="size-6 sm:size-7" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="absolute top-1/2 right-2 z-20 size-12 -translate-y-1/2 rounded-full border-white/60 bg-black/35 text-white shadow-lg hover:bg-black/55 hover:text-white active:not-aria-[haspopup]:translate-y-0 sm:right-4 sm:size-14"
        onClick={() => api?.scrollNext()}
        aria-label="Next hero slide"
      >
        <ChevronRight className="size-6 sm:size-7" />
      </Button>

      <div
        className="absolute inset-x-0 bottom-5 z-20 flex items-center justify-center gap-2.5"
        role="tablist"
        aria-label="Hero slides"
      >
        {slides.map((slide, index) => {
          const active = selected === index;
          return (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`Go to slide ${index + 1}`}
              className={[
                "transition-all duration-300",
                active
                  ? "h-2.5 w-8 rounded-full bg-white"
                  : "size-2.5 rounded-full bg-white/60 hover:bg-white",
              ].join(" ")}
              onClick={() => api?.scrollTo(index)}
            />
          );
        })}
      </div>
    </div>
  );
}

export function HeroSection({ slides = FALLBACK_HERO_SLIDES }: HeroSectionProps) {
  return (
    <section aria-label="Hero" className="border-b border-border">
      <HeroCarousel slides={slides.length > 0 ? slides : FALLBACK_HERO_SLIDES} />
    </section>
  );
}

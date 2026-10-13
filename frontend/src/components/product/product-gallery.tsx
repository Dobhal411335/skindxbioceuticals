"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useCarouselAutoplay } from "@/hooks/useCarouselAutoplay";
import type { PublicProductGalleryImage } from "@/types/product";
import { cn } from "@/lib/utils";

type ProductGalleryProps = {
  images: PublicProductGalleryImage[];
  productName: string;
  autoplayMs?: number;
};

export function ProductGallery({
  images,
  productName,
  autoplayMs = 4500,
}: ProductGalleryProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [thumbApi, setThumbApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const active = images[activeIndex] ?? images[0];

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      const index = api.selectedScrollSnap();
      setActiveIndex(index);
      thumbApi?.scrollTo(index);
    };
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, thumbApi]);

  useCarouselAutoplay(api, {
    enabled: images.length > 1,
    intervalMs: autoplayMs,
    paused: isPaused,
  });

  if (!active) return null;

  function goTo(index: number) {
    setActiveIndex(index);
    api?.scrollTo(index);
    thumbApi?.scrollTo(index);
  }

  return (
    <div
      className="space-y-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <Carousel
        setApi={setApi}
        opts={{ loop: images.length > 1, align: "start" }}
        className="relative"
      >
        <CarouselContent className="-ml-0">
          {images.map((image, index) => (
            <CarouselItem key={image.id} className="pl-0">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-surface lg:aspect-[5/6]">
                <Image
                  src={image.imageUrl}
                  alt={index === 0 ? productName : `${productName} ${index + 1}`}
                  fill
                  priority={index === 0}
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 45vw"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {images.length > 1 ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Previous image"
              className="absolute top-1/2 left-3 z-10 -translate-y-1/2 rounded-full bg-background/90 shadow-sm"
              onClick={() => api?.scrollPrev()}
            >
              <ChevronLeft className="size-5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Next image"
              className="absolute top-1/2 right-3 z-10 -translate-y-1/2 rounded-full bg-background/90 shadow-sm"
              onClick={() => api?.scrollNext()}
            >
              <ChevronRight className="size-5" />
            </Button>
          </>
        ) : null}
      </Carousel>

      {images.length > 1 ? (
        <Carousel
          setApi={setThumbApi}
          opts={{ align: "start", dragFree: true }}
          className="w-full"
        >
          <CarouselContent className="-ml-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {images.map((image, index) => (
              <CarouselItem
                key={image.id}
                className="basis-auto pl-2.5"
              >
                <button
                  type="button"
                  aria-label={`View image ${index + 1}`}
                  aria-current={index === activeIndex ? true : undefined}
                  className={cn(
                    "relative size-20 overflow-hidden rounded-md border-2 bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-24",
                    index === activeIndex
                      ? "border-foreground"
                      : "border-transparent",
                  )}
                  onClick={() => goTo(index)}
                >
                  <Image
                    src={image.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      ) : null}
    </div>
  );
}

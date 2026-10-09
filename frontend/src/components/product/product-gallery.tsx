"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CatalogImage } from "@/data/catalog";
import { cn } from "@/lib/utils";

type ProductGalleryProps = {
  images: CatalogImage[];
  productName: string;
};

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? images[0];

  if (!active) return null;

  function go(delta: number) {
    setActiveIndex((current) => {
      const next = current + delta;
      if (next < 0) return images.length - 1;
      if (next >= images.length) return 0;
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-surface">
        <Image
          src={active.src}
          alt={active.alt || productName}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 40vw"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Previous image"
          onClick={() => go(-1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <div className="flex flex-1 gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              aria-label={`View image ${index + 1}`}
              aria-current={index === activeIndex}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-md border bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                index === activeIndex ? "border-foreground" : "border-border",
              )}
              onClick={() => setActiveIndex(index)}
            >
              <Image
                src={image.src}
                alt=""
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Next image"
          onClick={() => go(1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

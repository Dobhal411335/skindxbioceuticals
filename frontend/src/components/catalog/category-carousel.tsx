"use client";

import Image from "next/image";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import type { PublicProductFacetCategory } from "@/types/product";

type CategoryCarouselProps = {
  categories: PublicProductFacetCategory[];
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
};

export function CategoryCarousel({
  categories,
  selectedSlug,
  onSelect,
}: CategoryCarouselProps) {
  if (categories.length === 0) {
    return null;
  }

  const showArrows = categories.length > 5;

  return (
    <Carousel
      opts={{ align: "start", dragFree: true }}
      className="w-full"
    >
      <CarouselContent className="-ml-3">
        {categories.map((category) => {
          const selected = selectedSlug === category.slug;
          return (
            <CarouselItem
              key={category.id}
              className="basis-[44%] pl-3 sm:basis-1/3 md:basis-1/4 lg:basis-1/6"
            >
              <button
                type="button"
                onClick={() =>
                  onSelect(selected ? null : category.slug)
                }
                className={cn(
                  "flex w-full flex-col items-center gap-2 rounded-xl border border-transparent px-2 py-3 text-center transition-colors",
                  "hover:bg-muted hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected && "border-primary/40 bg-primary/5",
                )}
                aria-pressed={selected}
              >
                <span className="relative size-20 overflow-hidden rounded-md border border-border bg-surface sm:size-24">
                  <Image
                    src={
                      category.imageUrl ||
                      "https://placehold.co/160x160/png?text=SkinDx"
                    }
                    alt=""
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </span>
                <span className="line-clamp-2 text-sm font-semibold text-foreground">
                  {category.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {category.productCount}{" "}
                  {category.productCount === 1 ? "Product" : "Products"}
                </span>
              </button>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      {showArrows ? (
        <>
          <CarouselPrevious className="-left-2 hidden sm:flex" />
          <CarouselNext className="-right-2 hidden sm:flex" />
        </>
      ) : null}
    </Carousel>
  );
}

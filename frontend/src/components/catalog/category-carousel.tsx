import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { PublicProductFacetCategory } from "@/types/product";

type CategoryCarouselProps = {
  categories: PublicProductFacetCategory[];
};

export function CategoryCarousel({ categories }: CategoryCarouselProps) {
  if (categories.length === 0) {
    return null;
  }

  const showArrows = categories.length > 5;

  return (
    <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
      <CarouselContent className="-ml-4">
        {categories.map((category, index) => (
          <CarouselItem
            key={category.id}
            className="basis-[72%] pl-4 sm:basis-1/2 md:basis-1/3 lg:basis-1/5"
          >
            <div className="group">
              <div
                className={`relative overflow-hidden rounded-[1.15rem] bg-surface ${
                  index % 2 === 0
                    ? "h-64 sm:h-72"
                    : "h-48 sm:h-56"
                }`}
              >
                <span className="absolute top-4 left-4 z-10 text-lg font-semibold tracking-tight text-white drop-shadow-md">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Image
                  src={
                    category.imageUrl ||
                    "https://placehold.co/640x800/png?text=SkinDx"
                  }
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  sizes="(max-width: 639px) 72vw, (max-width: 1023px) 33vw, 20vw"
                />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/25" />
                <Link
                  href={`/category/${encodeURIComponent(category.slug)}`}
                  className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100"
                  aria-label={`View ${category.name} products`}
                >
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-lg transition-transform duration-300 group-hover:scale-100 group-hover:bg-primary group-hover:text-primary-foreground">
                    View
                    <ArrowUpRight className="size-4" />
                  </span>
                </Link>
              </div>
              <Link
                href={`/category/${encodeURIComponent(category.slug)}`}
                className="mt-3 block truncate text-base font-semibold tracking-tight text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {category.name}
              </Link>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {showArrows ? (
        <>
          <CarouselPrevious className="-left-3 hidden sm:flex" />
          <CarouselNext className="-right-3 hidden sm:flex" />
        </>
      ) : null}
    </Carousel>
  );
}

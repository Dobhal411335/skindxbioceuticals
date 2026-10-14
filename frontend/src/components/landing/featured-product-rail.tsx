"use client";

import Link from "next/link";

import { StorefrontProductCard } from "@/components/landing/storefront-product-card";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { productRail } from "@/data/landing";
import type { PublicProductCard } from "@/types/product";

type FeaturedProductRailProps = {
  products: PublicProductCard[];
};

export function FeaturedProductRail({ products }: FeaturedProductRailProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section
      className="border-y border-border bg-surface/60"
      aria-labelledby="product-rail-heading"
    >
      <div className="container-page section-space grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.6fr)] lg:items-center">
        <div>
          <h2
            id="product-rail-heading"
            className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            {productRail.title}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {productRail.body}
          </p>
          <Button asChild className="mt-8 rounded-full p-6" size="lg">
            <Link href={productRail.cta.href}>{productRail.cta.label}</Link>
          </Button>
        </div>

        <div className="relative min-w-0">
          <Carousel opts={{ align: "start", loop: products.length > 3 }} className="w-full">
            <CarouselContent className="-ml-3">
              {products.map((product) => (
                <CarouselItem
                  key={product.id}
                  className="basis-[70%] pl-3 sm:basis-1/2 lg:basis-1/3"
                >
                  <StorefrontProductCard product={product} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-3 hidden md:flex" />
            <CarouselNext className="-right-3 hidden md:flex" />
          </Carousel>
        </div>
      </div>
    </section>
  );
}

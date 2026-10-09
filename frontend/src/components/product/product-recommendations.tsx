"use client";

import Link from "next/link";

import { ProductCard } from "@/components/landing/product-card";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { CatalogProduct } from "@/data/catalog";
import type { LandingProduct } from "@/data/landing";

type ProductRecommendationsProps = {
  products: CatalogProduct[];
};

function toLandingProduct(product: CatalogProduct): LandingProduct {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    pricePaise: product.priceInPaise,
    compareAtPaise: product.compareAtPriceInPaise,
    image: product.images[0]?.src ?? "",
    alt: product.images[0]?.alt ?? product.name,
    href: `/shop/${product.slug}`,
  };
}

export function ProductRecommendations({ products }: ProductRecommendationsProps) {
  if (products.length === 0) return null;

  return (
    <section className="container-page section-space">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.6fr)] lg:items-center">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Discover what everyone browses right now
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            A static recommendation rail. Live ranking will come from the catalogue
            API later.
          </p>
          <Button asChild className="mt-8 rounded-full px-6" size="lg">
            <Link href="/shop">Shop all collection</Link>
          </Button>
        </div>
        <div className="relative min-w-0">
          <Carousel opts={{ align: "start" }} className="w-full">
            <CarouselContent className="-ml-3">
              {products.map((product) => (
                <CarouselItem
                  key={product.id}
                  className="basis-[70%] pl-3 sm:basis-1/2 lg:basis-1/3"
                >
                  <ProductCard product={toLandingProduct(product)} />
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

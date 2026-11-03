"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { ProductCard } from "@/components/landing/product-card";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { PublicRelatedProduct } from "@/types/product";

type ProductRecommendationsProps = {
  products: PublicRelatedProduct[];
};

export function ProductRecommendations({ products }: ProductRecommendationsProps) {
  if (products.length === 0) return null;

  return (
    <section className="bg-[#f7f3eb]">
      <div className="container-page section-space grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.6fr)] lg:items-center">
        <div>
          <h2 id="more-from-this-category-heading" className="max-w-xl font-medium text-5xl leading-[0.98] tracking-[-0.04em] text-[#1c2a2e]"
          >
            More from this category
          </h2>
          <div className="mt-2 h-1 w-20 rounded-full bg-gradient-to-r from-[#ef6a24] to-[#f0d8c9]" />
          <Button asChild className="mt-8 rounded-full p-6" size="lg">
            <Link href="/category" className="flex items-center justify-center gap-2">
              <span>Browse categories</span>
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="relative min-w-0">
          <Carousel opts={{ align: "start" }} className="w-full">
            <CarouselContent className="-ml-3">
              {products.map((product) => (
                <CarouselItem
                  key={product.id}
                  className="flex basis-[70%] pl-3 sm:basis-1/2 lg:basis-1/3"
                >
                  <ProductCard product={product} />
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

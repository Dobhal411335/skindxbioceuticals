"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
import { fetchLandingProductsClient } from "@/features/products/product.service";
import { useAuth } from "@/hooks/useAuth";
import type { PublicProductCard } from "@/types/product";
import { ArrowUpRight } from "lucide-react";

type FeaturedProductRailProps = {
  products: PublicProductCard[];
};

export function FeaturedProductRail({ products }: FeaturedProductRailProps) {
  const { user, isAuthenticated } = useAuth();
  const [vendorItems, setVendorItems] = useState<PublicProductCard[] | null>(null);
  const isVendor = isAuthenticated && user?.role === "VENDOR";
  const items = isVendor && vendorItems?.length ? vendorItems : products;

  useEffect(() => {
    if (!isVendor) return;
    let cancelled = false;
    void (async () => {
      const next = await fetchLandingProductsClient(15);
      if (!cancelled && next.length > 0) {
        setVendorItems(next);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isVendor]);

  if (items.length === 0) {
    return null;
  }

  return (
    <section
      className="border-y border-[#ecebe7] bg-[#f8f7f4]"
      aria-labelledby="product-rail-heading"
    >
      <div className="container-page section-space">
        <div className="flex items-end justify-between gap-6">
          <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-[#ef6a24] uppercase">
              Our Products
            </p>
            <h2
              id="product-rail-heading"
              className="mt-5 max-w-2xl text-4xl leading-[0.98] font-semibold tracking-[-0.045em] text-foreground sm:text-5xl"
            >
              {productRail.title}
            </h2>
            <div className="mt-5 h-1 w-20 rounded-full bg-gradient-to-r from-[#ef6a24] to-[#f0d8c9]" />
          </div>
          <Button
            asChild
            variant="default"
            className="hidden shrink-0 text-base font-semibold sm:flex py-5 px-5 border border-primary rounded-full text-white hover:bg-primary hover:text-white"
          >
            <Link href={productRail.cta.href}>
              {productRail.cta.label} <ArrowUpRight className="size-4 ml-2" />
            </Link>
          </Button>
        </div>

        <div className="relative mt-9 min-w-0">
          <Carousel opts={{ align: "start", loop: items.length > 3 }} className="w-full">
            <CarouselContent className="-ml-3">
              {items.map((product) => (
                <CarouselItem
                  key={product.id}
                  className="basis-[78%] pl-3 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 py-2"
                >
                  <StorefrontProductCard product={product} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-3 hidden size-12 md:flex" />
            <CarouselNext className="-right-3 hidden size-12 md:flex" />
          </Carousel>
        </div>
      </div>
    </section>
  );
}

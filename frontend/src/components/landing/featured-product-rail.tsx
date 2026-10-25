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
            <p className="text-[11px] font-semibold tracking-[0.12em] text-primary uppercase">
              Clinically recommended
            </p>
            <h2
              id="product-rail-heading"
              className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
            >
              {productRail.title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {productRail.body}
            </p>
          </div>
          <Button
            asChild
            variant="link"
            className="hidden shrink-0 px-0 text-sm font-semibold text-primary sm:flex"
          >
            <Link href={productRail.cta.href}>
              {productRail.cta.label} <span aria-hidden>→</span>
            </Link>
          </Button>
        </div>

        <div className="relative mt-9 min-w-0">
          <Carousel opts={{ align: "start", loop: items.length > 3 }} className="w-full">
            <CarouselContent className="-ml-3">
              {items.map((product) => (
                <CarouselItem
                  key={product.id}
                  className="basis-[78%] pl-3 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
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

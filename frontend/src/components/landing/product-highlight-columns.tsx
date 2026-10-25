"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Clock3, Eye, ShoppingCart, Star } from "lucide-react";

import {
  ProductDiscountBadge,
  ProductPriceDisplay,
} from "@/components/catalog/product-price-display";
import { ProductQuickView } from "@/components/landing/product-quick-view";
import { useCartUi } from "@/components/cart/cart-ui-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  buildCartPricingFields,
  discountPercentForBadge,
  priceProductForRole,
} from "@/features/products/product-pricing";
import { useCartActions } from "@/hooks/useCartActions";
import { useIsVendor } from "@/hooks/useIsVendor";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { PublicProductCard, PublicProductHighlights } from "@/types/product";

function ProductListItem({
  product,
  onQuickView,
}: {
  product: PublicProductCard;
  onQuickView: (product: PublicProductCard) => void;
}) {
  const isVendor = useIsVendor();
  const priced = priceProductForRole({
    price: product.price,
    vendorPrice: product.vendorPrice,
    isVendor,
    coupon: product.coupon ?? null,
  });
  const discountPercent = discountPercentForBadge(priced);

  return (
    <li>
      <div className="group relative flex gap-4 py-2.5">
        <div className="relative size-25 shrink-0 overflow-hidden rounded-[3px] bg-[#f1f2f0]">
          <Link
            href={`/products/${product.slug}`}
            className="absolute inset-0 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Image
              src={product.imageUrl || "https://placehold.co/128x128/png?text=SkinDx"}
              alt={product.name}
              fill
              className="object-contain transition-transform duration-300 group-hover:scale-105"
              sizes="96px"
            />
          </Link>
          {discountPercent != null ? (
            <ProductDiscountBadge
              percent={discountPercent}
              className="absolute top-1 left-1 z-20"
            />
          ) : null}
          <button
            type="button"
            aria-label={`Quick look ${product.name}`}
            className={cn(
              "absolute inset-0 z-10 flex items-center justify-center bg-foreground/35 text-background",
              "opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100",
            )}
            onClick={() => onQuickView(product)}
          >
            <span className="flex size-9 items-center justify-center rounded-full border-2 border-background bg-background/95 text-foreground shadow-sm">
              <Eye className="size-4" />
            </span>
          </button>
        </div>
        <div className="min-w-0 flex-1 self-center">
          <p className="line-clamp-1 text-[10px] font-semibold tracking-[0.08em] text-primary uppercase">
            {product.categoryName ?? "Product"}
          </p>
          <Link
            href={`/products/${product.slug}`}
            className="mt-1 line-clamp-2 text-sm leading-snug font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {product.name}
          </Link>
          <ProductPriceDisplay
            price={product.price}
            vendorPrice={product.vendorPrice}
            isVendor={isVendor}
            coupon={product.coupon}
            priced={priced}
            showBadge={false}
            size="sm"
            className="mt-1 [&>span:first-child]:!text-sm [&>span:first-child]:!text-foreground"
          />
        </div>
      </div>
    </li>
  );
}

function FeaturedHighlightCard({
  product,
  onQuickView,
}: {
  product: PublicProductCard;
  onQuickView: (product: PublicProductCard) => void;
}) {
  const { openCart } = useCartUi();
  const { add: addToCartAction } = useCartActions();
  const quantity = 1;
  const isVendor = useIsVendor();

  const maxQty = product.quantity;
  const canAdd = Boolean(product.defaultVariantId) && maxQty > 0;
  const priced = priceProductForRole({
    price: product.price,
    vendorPrice: product.vendorPrice,
    isVendor,
    coupon: product.coupon ?? null,
  });
  const discountPercent = discountPercentForBadge(priced);

  function clampQty(next: number) {
    if (maxQty <= 0) return 1;
    return Math.min(maxQty, Math.max(1, next));
  }

  async function addToCart() {
    if (!product.defaultVariantId || maxQty <= 0) {
      showError("This product is out of stock.", {
        id: "highlight.cart.error",
      });
      return;
    }
    const pricing = buildCartPricingFields(product.price, product.coupon ?? null, {
      isVendor,
      vendorPrice: product.vendorPrice,
      b2cPrice: product.price,
    });
    const ok = await addToCartAction({
      productId: product.id,
      variantId: product.defaultVariantId,
      slug: product.slug,
      name: product.name,
      image: product.imageUrl ?? "",
      alt: product.name,
      categoryName: product.categoryName,
      unitPriceInPaise: pricing.unitPriceInPaise,
      originalUnitPriceInPaise: pricing.originalUnitPriceInPaise,
      discountCode: pricing.discountCode,
      discountInPaise: pricing.discountInPaise,
      cgstPercent: product.tax?.cgst ?? 0,
      sgstPercent: product.tax?.sgst ?? 0,
      quantity: clampQty(quantity),
    });
    if (ok) openCart();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="group relative mb-4 aspect-[1.08] overflow-hidden rounded-[3px] bg-[#f1f2f0]">
        <Image
          src={product.imageUrl || "https://placehold.co/600x600/png?text=SkinDx"}
          alt={product.name}
          fill
          className="object-contain transition-transform duration-300 group-hover:scale-[1.04]"
          sizes="(max-width: 1024px) 100vw, 33vw"
        />
        {discountPercent != null ? (
          <ProductDiscountBadge percent={discountPercent} className="absolute top-2 left-2 z-10" />
        ) : null}
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className={cn(
            "absolute left-1/2 top-1/2 z-10 size-11 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-foreground/40 bg-card text-foreground shadow-sm",
            "opacity-0 transition-opacity duration-200",
            "group-hover:opacity-100 focus-visible:opacity-100",
            "hover:border-foreground hover:bg-foreground hover:text-background",
          )}
          aria-label={`Quick look ${product.name}`}
          onClick={() => onQuickView(product)}
        >
          <Eye className="size-5" />
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="line-clamp-1 text-[10px] font-semibold tracking-[0.08em] text-primary uppercase">
          {product.categoryName ?? "Product"}
        </p>
        <div
          className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary"
          aria-label={`Rated ${product.averageRating} out of 5`}
        >
          <Star className="size-3 fill-current" aria-hidden />
          {product.averageRating.toFixed(2)} / 5.0
        </div>
      </div>
      <div className="mt-2 flex items-start justify-between gap-3">
        <Link
          href={`/products/${product.slug}`}
          className="line-clamp-2 text-xl leading-tight font-semibold transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {product.name}
        </Link>
        <ProductPriceDisplay
          price={product.price}
          vendorPrice={product.vendorPrice}
          isVendor={isVendor}
          coupon={product.coupon}
          priced={priced}
          showBadge={false}
          size="lg"
          className="shrink-0 justify-end [&>span:first-child]:!text-lg [&>span:first-child]:!text-primary"
        />
      </div>
      <p className="mt-2 line-clamp-3 min-h-[4.7rem] text-xs leading-relaxed text-muted-foreground">
        {product.description
          ? product.description
              .replace(/<[^>]*>/g, " ")
              .replace(/\s+/g, " ")
              .trim()
          : "A considered formulation for comfortable, healthy-looking skin."}
      </p>
      <div className="mt-4 flex items-center gap-2">
        <Button
          type="button"
          className="flex-1 rounded-[3px] bg-primary px-4 py-5 text-sm font-semibold"
          disabled={!canAdd}
          onClick={() => void addToCart()}
        >
          <ShoppingCart className="size-4" />
          Add to cart <span aria-hidden>·</span>{" "}
          {priced.unitPrice.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          })}
        </Button>
      </div>
    </div>
  );
}

type ProductHighlightColumnsProps = {
  highlights: PublicProductHighlights;
};

export function ProductHighlightColumns({ highlights }: ProductHighlightColumnsProps) {
  const { recent, featured, bestSellers } = highlights;
  const [quickProduct, setQuickProduct] = useState<PublicProductCard | null>(null);
  const hasContent = recent.length > 0 || featured.length > 0 || bestSellers.length > 0;

  if (!hasContent) {
    return null;
  }

  if (featured.length === 0) {
    return null;
  }

  if (recent.length === 0) return null;
  if (bestSellers.length === 0) return null;

  return (
    <section
      className="border-y border-[#ecebe7] bg-[#f6f5f2]"
      aria-labelledby="highlights-heading"
    >
      <div className="container-page section-space">
        <h2 id="highlights-heading" className="sr-only">
          Product highlights
        </h2>
        <div className="grid items-stretch gap-5 lg:grid-cols-3">
          <div className="flex min-h-[37.5rem] flex-col rounded-[8px] border border-[#e8e8e4] bg-card p-5 shadow-[0_1px_2px_rgb(20_35_45_/_.03)]">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-bold">Recently added</h3>
              <Clock3 className="size-4 text-primary" aria-hidden />
            </div>
            <ul className="mt-5 space-y-1">
              {recent.map((product) => (
                <ProductListItem key={product.id} product={product} onQuickView={setQuickProduct} />
              ))}
            </ul>
            <Link
              href="/category"
              className="mt-auto inline-flex items-center gap-1 pt-6 text-xs font-semibold text-primary hover:underline"
            >
              See new arrivals <span aria-hidden>›</span>
            </Link>
          </div>

          <Card className="min-h-[37.5rem] rounded-[8px] border border-[#e8e8e4] bg-card shadow-[0_1px_2px_rgb(20_35_45_/_.03)]">
            <CardContent className="flex h-full flex-col p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="rounded-full bg-[#e7f4f1] px-3 py-1 text-[10px] font-semibold tracking-[0.08em] text-primary uppercase">
                  Product of the month
                </span>
                {featured.length > 1 ? (
                  <span className="text-xs text-muted-foreground">Featured picks</span>
                ) : null}
              </div>

              {featured.length === 1 ? (
                <FeaturedHighlightCard product={featured[0]!} onQuickView={setQuickProduct} />
              ) : (
                <Carousel opts={{ align: "start", loop: true }} className="w-full">
                  <CarouselContent>
                    {featured.map((product) => (
                      <CarouselItem key={product.id}>
                        <FeaturedHighlightCard product={product} onQuickView={setQuickProduct} />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="-left-2" />
                  <CarouselNext className="-right-2" />
                </Carousel>
              )}
            </CardContent>
          </Card>

          <div className="flex min-h-[37.5rem] flex-col rounded-[8px] border border-[#e8e8e4] bg-card p-5 shadow-[0_1px_2px_rgb(20_35_45_/_.03)]">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-bold">Popular products</h3>
              <ArrowUpRight className="size-4 text-primary" aria-hidden />
            </div>
            <ul className="mt-5 space-y-1">
              {bestSellers.map((product) => (
                <ProductListItem key={product.id} product={product} onQuickView={setQuickProduct} />
              ))}
            </ul>
            <Link
              href="/category"
              className="mt-auto inline-flex items-center gap-1 pt-6 text-xs font-semibold text-primary hover:underline"
            >
              See all top sellers <span aria-hidden>›</span>
            </Link>
          </div>
        </div>

        <ProductQuickView
          slug={quickProduct?.slug ?? null}
          categoryName={quickProduct?.categoryName}
          open={Boolean(quickProduct)}
          onOpenChange={(open) => {
            if (!open) setQuickProduct(null);
          }}
        />
      </div>
    </section>
  );
}

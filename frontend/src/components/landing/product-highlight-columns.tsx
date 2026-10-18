"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Eye, Minus, Plus, ArrowUpRight, ShoppingCart } from "lucide-react";

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
import { ProductRatingStars } from "@/components/landing/product-rating-stars";
import {
  buildCartPricingFields,
  discountPercentForBadge,
  priceProductForRole,
} from "@/features/products/product-pricing";
import { useCartActions } from "@/hooks/useCartActions";
import { useIsVendor } from "@/hooks/useIsVendor";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type {
  PublicProductCard,
  PublicProductHighlights,
} from "@/types/product";

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
      <div
        className={cn(
          "group relative flex gap-4 rounded-xl border border-border p-3",
          "transition-all duration-300 hover:scale-[1.02] hover:border-primary hover:bg-muted/60",
        )}
      >
        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-surface sm:size-24">
          <Link
            href={`/products/${product.slug}`}
            className="absolute inset-0 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Image
              src={
                product.imageUrl ||
                "https://placehold.co/128x128/png?text=SkinDx"
              }
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
          <p className="text-[11px] line-clamp-1 font-semibold tracking-[0.08em] text-primary uppercase">
            {product.categoryName ?? "Product"}
          </p>
          <Link
            href={`/products/${product.slug}`}
            className="mt-0.5 line-clamp-2 text-sm leading-snug font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-[14px]"
          >
            {product.name}
          </Link>
          <div className="mt-1">
            <ProductRatingStars
              averageRating={product.averageRating}
              reviewCount={product.reviewCount}
              className="text-foreground"
            />
          </div>
          <ProductPriceDisplay
            price={product.price}
            vendorPrice={product.vendorPrice}
            isVendor={isVendor}
            coupon={product.coupon}
            priced={priced}
            showBadge={false}
            size="sm"
            className="mt-1"
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
  const [quantity, setQuantity] = useState(1);
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
      <div className="group relative mb-4 aspect-square overflow-hidden rounded-lg bg-surface">
        <Image
          src={
            product.imageUrl || "https://placehold.co/600x600/png?text=SkinDx"
          }
          alt={product.name}
          fill
          className="object-contain transition-transform duration-300 group-hover:scale-[1.04]"
          sizes="(max-width: 1024px) 100vw, 33vw"
        />
        {discountPercent != null ? (
          <ProductDiscountBadge
            percent={discountPercent}
            className="absolute top-2 left-2 z-10"
          />
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

      <p className="text-center text-[11px] font-semibold line-clamp-2 ellipsis tracking-[0.08em] text-primary uppercase">
        {product.categoryName ?? "Product"}
      </p>
      <Link
        href={`/products/${product.slug}`}
        className="mt-1 line-clamp-2 ellipsis text-center font-display text-xl font-semibold transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {product.name}
      </Link>
      <div className="mt-2 flex justify-center">
        <ProductRatingStars
          averageRating={product.averageRating}
          reviewCount={product.reviewCount}
          className="text-foreground"
        />
      </div>
      <ProductPriceDisplay
        price={product.price}
        vendorPrice={product.vendorPrice}
        isVendor={isVendor}
        coupon={product.coupon}
        priced={priced}
        showBadge={false}
        size="lg"
        className="mt-2 justify-center"
      />

      <div className="mt-4 flex items-center gap-2">
        <div className="inline-flex items-center rounded border border-black">
          <button
            type="button"
            className="px-2.5 py-1.5"
            onClick={() => setQuantity((value) => clampQty(value - 1))}
            aria-label="Decrease quantity"
            disabled={!canAdd}
          >
            <Minus className="size-3.5" />
          </button>
          <span className="min-w-7 border-x border-black px-2 py-1.5 text-center text-sm">
            {canAdd ? quantity : 0}
          </span>
          <button
            type="button"
            className="px-2.5 py-1.5"
            onClick={() => setQuantity((value) => clampQty(value + 1))}
            aria-label="Increase quantity"
            disabled={!canAdd}
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        <Button
          type="button"
          className="flex-1 px-4 py-5 rounded-full"
          disabled={!canAdd}
          onClick={() => void addToCart()}
        >
          <ShoppingCart className="size-4" />
          Add to cart
        </Button>
      </div>

      <Button asChild variant="outline" className="mt-3 w-full border border-black hover:border-primary hover:bg-primary hover:text-white transition-all duration-300 hover:shadow-md" size="lg">
        <Link href={`/products/${product.slug}`}>View details <ArrowUpRight className="size-4" /></Link>
      </Button>
    </div>
  );
}

type ProductHighlightColumnsProps = {
  highlights: PublicProductHighlights;
};

export function ProductHighlightColumns({
  highlights,
}: ProductHighlightColumnsProps) {
  const { recent, featured, bestSellers } = highlights;
  const [quickProduct, setQuickProduct] = useState<PublicProductCard | null>(
    null,
  );
  const hasContent =
    recent.length > 0 || featured.length > 0 || bestSellers.length > 0;

  if (!hasContent) {
    return null;
  }

  if (featured.length === 0) {
    return null;
  }

  if(recent.length === 0) return null;


  return (
    <section
      className="container-page section-space"
      aria-labelledby="highlights-heading"
    >
      <h2 id="highlights-heading" className="sr-only">
        Product highlights
      </h2>
      <div className="grid gap-8 lg:grid-cols-3">
        <div>
          <h3 className="mb-4 text-xl font-semibold">Recent products</h3>
          
            <ul className="space-y-2">
              {recent.map((product) => (
                <ProductListItem
                  key={product.id}
                  product={product}
                  onQuickView={setQuickProduct}
                />
              ))}
            </ul>
        </div>

        <Card className="border-2 border-primary/40 shadow-none">
          <CardContent className="flex h-full flex-col p-3">
            <div className="mb-4 text-center">
              <h3 className="text-xl font-semibold">Featured products</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Trusted essentials curated for everyday care.
              </p>
            </div>

            {featured.length === 1 ? (
              <FeaturedHighlightCard
                product={featured[0]!}
                onQuickView={setQuickProduct}
              />
            ) : (
              <Carousel opts={{ align: "start", loop: true }} className="w-full">
                <CarouselContent>
                  {featured.map((product) => (
                    <CarouselItem key={product.id}>
                      <FeaturedHighlightCard
                        product={product}
                        onQuickView={setQuickProduct}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="-left-2" />
                <CarouselNext className="-right-2" />
              </Carousel>
            )}
          </CardContent>
        </Card>

        <div>
          <h3 className="mb-4 text-xl font-semibold">Our bestsellers</h3>
          {bestSellers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No bestsellers flagged yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {bestSellers.map((product) => (
                <ProductListItem
                  key={product.id}
                  product={product}
                  onQuickView={setQuickProduct}
                />
              ))}
            </ul>
          )}
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
    </section>
  );
}

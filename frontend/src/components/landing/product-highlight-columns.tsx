"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Eye, Minus, Plus } from "lucide-react";

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
import { rupeesToPaise } from "@/features/products/product-selection";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { showError, showSuccess } from "@/lib/toast";
import { cn, formatInr } from "@/lib/utils";
import { addCartItem } from "@/store/slices/cartSlice";
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
  return (
    <li>
      <div
        className={cn(
          "group relative flex gap-4 rounded-xl border border-transparent p-3",
          "transition-all duration-300 hover:scale-[1.02] hover:border-border hover:bg-muted/60",
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
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="96px"
            />
          </Link>
          <button
            type="button"
            aria-label={`Quick look ${product.name}`}
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-foreground/35 text-background",
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
          <p className="text-[11px] font-semibold tracking-wider text-primary uppercase">
            {product.categoryName ?? "Product"}
          </p>
          <Link
            href={`/products/${product.slug}`}
            className="mt-0.5 line-clamp-2 text-sm font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-[15px]"
          >
            {product.name}
          </Link>
          <p className="mt-1 text-sm font-semibold text-foreground sm:text-base">
            {formatInr(product.price)}
          </p>
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
  const dispatch = useAppDispatch();
  const { openCart } = useCartUi();
  const [quantity, setQuantity] = useState(1);

  const maxQty = product.quantity;
  const canAdd = Boolean(product.defaultVariantId) && maxQty > 0;

  function clampQty(next: number) {
    if (maxQty <= 0) return 1;
    return Math.min(maxQty, Math.max(1, next));
  }

  function addToCart() {
    if (!product.defaultVariantId || maxQty <= 0) {
      showError("This product is out of stock.", {
        id: "highlight.cart.error",
      });
      return;
    }
    try {
      dispatch(
        addCartItem({
          productId: product.id,
          variantId: product.defaultVariantId,
          slug: product.slug,
          name: product.name,
          image: product.imageUrl ?? "",
          alt: product.name,
          unitPriceInPaise: rupeesToPaise(product.price),
          quantity: clampQty(quantity),
        }),
      );
      showSuccess("Added to cart.", { id: "highlight.cart" });
      openCart();
    } catch {
      showError("Could not add to cart. Please try again.", {
        id: "highlight.cart.error",
      });
    }
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
          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          sizes="(max-width: 1024px) 100vw, 33vw"
        />
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className={cn(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 size-11 rounded-full border-2 border-foreground/40 bg-card text-foreground shadow-sm",
            "opacity-0 transition-opacity duration-200",
            "group-hover:opacity-100 focus-visible:opacity-100",
            "group-hover:bg-gray-200 hover:bg-gray-200",
            "hover:border-foreground hover:bg-foreground hover:text-background"
          )}
          aria-label={`Quick look ${product.name}`}
          onClick={() => onQuickView(product)}
        >
          <Eye className="size-5" />
        </Button>
   

      </div>

      <p className="text-center text-[11px] font-semibold tracking-wider text-primary uppercase">
        {product.categoryName ?? "Product"}
      </p>
      <h3 className="mt-1 text-center font-display text-xl font-semibold">
        {product.name}
      </h3>
      <div className="mt-2 flex justify-center">
        <ProductRatingStars
          averageRating={product.averageRating}
          reviewCount={product.reviewCount}
        />
      </div>
      <p className="mt-2 text-center text-lg font-semibold">
        {formatInr(product.price)}
      </p>

      <div className="mt-4 flex items-center gap-2">
        <div className="inline-flex items-center rounded-full border border-border">
          <button
            type="button"
            className="px-2.5 py-1.5"
            onClick={() => setQuantity((value) => clampQty(value - 1))}
            aria-label="Decrease quantity"
            disabled={!canAdd}
          >
            <Minus className="size-3.5" />
          </button>
          <span className="min-w-7 border-x border-border px-2 py-1.5 text-center text-sm">
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
          className="flex-1"
          disabled={!canAdd}
          onClick={addToCart}
        >
          Add to cart
        </Button>
      </div>

      <Button asChild variant="outline" className="mt-3 w-full" size="lg">
        <Link href={`/products/${product.slug}`}>View details</Link>
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
          <h3 className="mb-4 text-lg font-semibold">Recent products</h3>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No recent products flagged yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {recent.map((product) => (
                <ProductListItem
                  key={product.id}
                  product={product}
                  onQuickView={setQuickProduct}
                />
              ))}
            </ul>
          )}
        </div>

        <Card className="border-2 border-primary/40 shadow-none">
          <CardContent className="flex h-full flex-col p-5">
            <div className="mb-4 text-center">
              <h3 className="text-lg font-semibold">Featured products</h3>
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
          <h3 className="mb-4 text-lg font-semibold">Our bestsellers</h3>
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

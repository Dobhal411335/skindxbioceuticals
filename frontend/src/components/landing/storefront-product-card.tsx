"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Eye, Heart, ShoppingCart } from "lucide-react";

import {
  ProductDiscountBadge,
  ProductPriceDisplay,
} from "@/components/catalog/product-price-display";
import { ProductQuickView } from "@/components/landing/product-quick-view";
import { ProductRatingStars } from "@/components/landing/product-rating-stars";
import { useCartUi } from "@/components/cart/cart-ui-context";
import { Button } from "@/components/ui/button";
import {
  applyProductCoupon,
  buildCartPricingFields,
  discountPercentForBadge,
  stockQtyBadgeClass,
} from "@/features/products/product-pricing";
import { useCartActions } from "@/hooks/useCartActions";
import { useWishlistActions } from "@/hooks/useWishlistActions";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { PublicProductCard } from "@/types/product";

type StorefrontProductCardProps = {
  product: PublicProductCard;
  className?: string;
};

export function StorefrontProductCard({
  product,
  className,
}: StorefrontProductCardProps) {
  const { openCart } = useCartUi();
  const { add: addToCartAction } = useCartActions();
  const {
    toggle: toggleWishlist,
    isInWishlist,
    authLoading: wishlistAuthLoading,
  } = useWishlistActions();
  const [quickOpen, setQuickOpen] = useState(false);
  const [wishlistPending, setWishlistPending] = useState(false);

  const href = `/products/${product.slug}`;
  const imageUrl =
    product.imageUrl || "https://placehold.co/600x600/png?text=SkinDx";
  const inWishlist = isInWishlist(product.id);
  const canAdd =
    Boolean(product.defaultVariantId) && product.quantity > 0;
  const priced = applyProductCoupon(product.price, product.coupon ?? null);
  const discountPercent = discountPercentForBadge(priced);

  async function addToCart() {
    if (!product.defaultVariantId || product.quantity <= 0) {
      showError("This product is out of stock.", { id: "rail.cart.error" });
      return;
    }
    const pricing = buildCartPricingFields(
      product.price,
      product.coupon ?? null,
    );
    const ok = await addToCartAction({
      productId: product.id,
      variantId: product.defaultVariantId,
      slug: product.slug,
      name: product.name,
      image: product.imageUrl ?? "",
      alt: product.name,
      unitPriceInPaise: pricing.unitPriceInPaise,
      originalUnitPriceInPaise: pricing.originalUnitPriceInPaise,
      discountCode: pricing.discountCode,
      discountInPaise: pricing.discountInPaise,
      cgstPercent: product.tax?.cgst ?? 0,
      sgstPercent: product.tax?.sgst ?? 0,
      quantity: 1,
    });
    if (ok) openCart();
  }

  async function onWishlist() {
    if (wishlistPending || wishlistAuthLoading) return;
    setWishlistPending(true);
    try {
      await toggleWishlist({
        productId: product.id,
        variantId: product.defaultVariantId,
        productName: product.name,
        productSlug: product.slug,
        imageUrl: product.imageUrl,
        price: String(product.price),
        currency: "INR",
        available: product.quantity > 0,
        quantity: product.quantity,
        coupon: product.coupon ?? null,
      });
    } finally {
      setWishlistPending(false);
    }
  }

  return (
    <>
      <article
        className={cn(
          "group flex h-full flex-col rounded-xl border border-border bg-card p-2 shadow-none transition-[border-color,box-shadow] duration-300 hover:border-primary hover:shadow-sm",
          className,
        )}
      >
        <div className="relative aspect-square overflow-hidden rounded-lg bg-surface">
          <Link
            href={href}
            className="absolute inset-0 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-contain transition-transform duration-300 group-hover:scale-[1.04]"
              sizes="(max-width: 768px) 70vw, 25vw"
            />
          </Link>

          {discountPercent != null ? (
            <ProductDiscountBadge
              percent={discountPercent}
              className="absolute top-2 left-2 z-10"
            />
          ) : null}

          <span
            className={cn(
              "absolute bottom-2 left-2 z-10 rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums",
              stockQtyBadgeClass(product.quantity),
            )}
          >
            {product.quantity} left
          </span>

          <div className="absolute top-2.5 right-2.5 flex flex-col gap-2">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className={cn(
                "size-9 rounded-full border-2 bg-card shadow-sm transition-all duration-200",
                "translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 focus-visible:translate-x-0 focus-visible:opacity-100",
                inWishlist
                  ? "border-primary text-primary opacity-100"
                  : "border-primary/50 text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground",
              )}
              aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
              disabled={wishlistPending || wishlistAuthLoading}
              onClick={() => void onWishlist()}
            >
              <Heart
                className={cn("size-3.5", inWishlist ? "fill-primary" : "")}
              />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className={cn(
                "size-9 rounded-full border-2 border-foreground/40 bg-card text-foreground shadow-sm",
                "translate-x-1 opacity-0 transition-all duration-200 delay-75",
                "group-hover:translate-x-0 group-hover:opacity-100 focus-visible:translate-x-0 focus-visible:opacity-100",
                "hover:border-foreground hover:bg-foreground hover:text-background",
              )}
              aria-label="Quick look"
              onClick={() => setQuickOpen(true)}
            >
              <Eye className="size-3.5" />
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-1 flex-col gap-2 px-0.5">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-primary uppercase">
            {product.categoryName ?? "Product"}
          </p>
          <Link
            href={href}
            className="line-clamp-2 ellipsis text-base leading-snug font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {product.name}
          </Link>
          <ProductRatingStars
            averageRating={product.averageRating}
            reviewCount={product.reviewCount}
            className="text-foreground"
          />
          <ProductPriceDisplay
            price={product.price}
            coupon={product.coupon}
            priced={priced}
            showBadge={false}
            size="lg"
          />

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span
              className={cn(
                "font-medium",
                canAdd ? "text-success" : "text-destructive",
              )}
            >
              {canAdd ? "In stock" : "Out of stock"}
            </span>
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums",
                stockQtyBadgeClass(product.quantity),
              )}
            >
              {product.quantity} left
            </span>
          </div>

          <Button
            type="button"
            className={cn(
              "mt-auto w-full rounded-full font-semibold transition-colors duration-300 p-5",
              canAdd
                ? "bg-primary text-primary-foreground"
                : "",
            )}
            disabled={!canAdd}
            onClick={() => void addToCart()}
          >
            {canAdd ? (
              <>
                <ShoppingCart className="size-4" />
                <span>Add To Cart</span>
              </>
            ) : (
              "Out of stock"
            )}
          </Button>
        </div>
      </article>

      <ProductQuickView
        slug={quickOpen ? product.slug : null}
        categoryName={product.categoryName}
        open={quickOpen}
        onOpenChange={setQuickOpen}
      />
    </>
  );
}

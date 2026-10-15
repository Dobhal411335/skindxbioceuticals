"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";

import { ProductDiscountBadge } from "@/components/catalog/product-price-display";
import { useCartUi } from "@/components/cart/cart-ui-context";
import { Button } from "@/components/ui/button";
import {
  applyProductCoupon,
  buildCartPricingFields,
  discountBannerText,
  discountPercentForBadge,
} from "@/features/products/product-pricing";
import { useCartActions } from "@/hooks/useCartActions";
import { useWishlistActions } from "@/hooks/useWishlistActions";
import { showError } from "@/lib/toast";
import { cn, formatInr } from "@/lib/utils";
import type { PublicRelatedProduct } from "@/types/product";

type ProductCardProps = {
  product: PublicRelatedProduct;
  className?: string;
};

export function ProductCard({ product, className }: ProductCardProps) {
  const { openCart } = useCartUi();
  const { add: addToCartAction } = useCartActions();
  const {
    toggle: toggleWishlist,
    isInWishlist,
    authLoading: wishlistAuthLoading,
  } = useWishlistActions();
  const [wishlistPending, setWishlistPending] = useState(false);
  const [cartPending, setCartPending] = useState(false);

  const href = `/products/${product.slug}`;
  const imageUrl =
    product.imageUrl || "https://placehold.co/600x600/png?text=SkinDx";
  const inWishlist = isInWishlist(product.id);
  const canAdd = Boolean(product.defaultVariantId) && product.quantity > 0;
  const priced = applyProductCoupon(product.price, product.coupon ?? null);
  const discountPercent = discountPercentForBadge(priced);
  const discountLabel = discountBannerText(priced);

  async function addToCart() {
    if (!product.defaultVariantId || product.quantity <= 0) {
      showError("This product is out of stock.", { id: "related.cart.error" });
      return;
    }
    if (cartPending) return;
    setCartPending(true);
    try {
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
        categoryName: product.categoryName,
        unitPriceInPaise: pricing.unitPriceInPaise,
        originalUnitPriceInPaise: pricing.originalUnitPriceInPaise,
        discountCode: pricing.discountCode,
        discountInPaise: pricing.discountInPaise,
        cgstPercent: product.tax?.cgst ?? 0,
        sgstPercent: product.tax?.sgst ?? 0,
        quantity: 1,
      });
      if (ok) openCart();
    } finally {
      setCartPending(false);
    }
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
        categoryName: product.categoryName,
        imageUrl: product.imageUrl,
        price: String(product.price),
        currency: "INR",
        available: product.quantity > 0,
        quantity: product.quantity,
        cgstPercent: product.tax?.cgst ?? 0,
        sgstPercent: product.tax?.sgst ?? 0,
        coupon: product.coupon ?? null,
      });
    } finally {
      setWishlistPending(false);
    }
  }

  return (
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

        <div className="absolute top-2.5 right-2.5 z-10">
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
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col gap-2 px-0.5">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-primary uppercase">
          {product.categoryName ?? "Product"}
        </p>
        <Link
          href={href}
          className="line-clamp-2 text-base leading-snug font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {product.name}
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xl font-semibold text-foreground">
            {formatInr(priced.unitPrice)}
          </p>
          {priced.hasDiscount ? (
            <p className="text-sm text-muted-foreground line-through">
              {formatInr(priced.originalPrice)}
            </p>
          ) : null}
          {discountLabel ? (
            <p className="inline-flex rounded bg-primary px-2.5 py-1 text-xs font-semibold text-white">
              {discountLabel}
            </p>
          ) : null}
        </div>

        <Button
          type="button"
          className={cn(
            "w-full rounded-full p-5 font-semibold transition-all duration-300",
            "translate-y-1 opacity-0 pointer-events-none",
            "group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto",
            "focus-visible:translate-y-0 focus-visible:opacity-100 focus-visible:pointer-events-auto",
            canAdd ? "bg-primary text-primary-foreground" : "",
          )}
          disabled={!canAdd || cartPending}
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
  );
}

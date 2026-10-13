"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Eye, Heart } from "lucide-react";

import { ProductQuickView } from "@/components/landing/product-quick-view";
import { ProductRatingStars } from "@/components/landing/product-rating-stars";
import { useCartUi } from "@/components/cart/cart-ui-context";
import { Button } from "@/components/ui/button";
import { rupeesToPaise } from "@/features/products/product-selection";
import { useWishlistActions } from "@/hooks/useWishlistActions";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { showError, showSuccess } from "@/lib/toast";
import { cn, formatInr } from "@/lib/utils";
import { addCartItem } from "@/store/slices/cartSlice";
import type { PublicProductCard } from "@/types/product";

type StorefrontProductCardProps = {
  product: PublicProductCard;
  className?: string;
};

export function StorefrontProductCard({
  product,
  className,
}: StorefrontProductCardProps) {
  const dispatch = useAppDispatch();
  const { openCart } = useCartUi();
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

  function addToCart() {
    if (!product.defaultVariantId || product.quantity <= 0) {
      showError("This product is out of stock.", { id: "rail.cart.error" });
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
          quantity: 1,
        }),
      );
      showSuccess("Added to cart.", { id: "rail.cart" });
      openCart();
    } catch {
      showError("Could not add to cart. Please try again.", {
        id: "rail.cart.error",
      });
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
        imageUrl: product.imageUrl,
        price: String(product.price),
        currency: "INR",
        available: product.quantity > 0,
      });
    } finally {
      setWishlistPending(false);
    }
  }

  return (
    <>
      <article
        className={cn(
          "group flex h-full flex-col rounded-xl border border-border bg-card p-3 shadow-none transition-[border-color,box-shadow] duration-300 hover:border-primary hover:shadow-sm",
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
              className="object-contain p-3 transition-transform duration-300 group-hover:scale-[1.04]"
              sizes="(max-width: 768px) 70vw, 25vw"
            />
          </Link>

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
            className="line-clamp-3 text-base leading-snug font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {product.name}
          </Link>
          <ProductRatingStars
            averageRating={product.averageRating}
            reviewCount={product.reviewCount}
            className="text-foreground"
          />
          <p className="text-lg font-bold text-primary">
            {formatInr(product.price)}
          </p>

          <Button
            type="button"
            className={cn(
              "mt-auto w-full rounded-full font-semibold transition-colors duration-300",
              canAdd
                ? "bg-primary text-primary-foreground group-hover:bg-foreground group-hover:text-background"
                : "",
            )}
            disabled={!canAdd}
            onClick={addToCart}
          >
            {canAdd ? "Add To Cart" : "Out of stock"}
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

"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Eye, Minus, Plus } from "lucide-react";

import { ProductQuickView } from "@/components/landing/product-quick-view";
import { ProductRatingStars } from "@/components/landing/product-rating-stars";
import { useCartUi } from "@/components/cart/cart-ui-context";
import { Button } from "@/components/ui/button";
import { rupeesToPaise } from "@/features/products/product-selection";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { showError, showSuccess } from "@/lib/toast";
import { cn, formatInr } from "@/lib/utils";
import {
  addCartItem,
  removeCartItem,
  updateCartItemQuantity,
} from "@/store/slices/cartSlice";
import type { CatalogViewMode, PublicProductCard } from "@/types/product";

type CatalogProductCardProps = {
  product: PublicProductCard;
  viewMode: CatalogViewMode;
};

function cartLineId(productId: string, variantId?: string | null) {
  return `${productId}:${variantId ?? "default"}`;
}

function discountPercent(
  price: number,
  compareAtPrice: number | null | undefined,
): number | null {
  if (compareAtPrice == null || compareAtPrice <= price || price <= 0) {
    return null;
  }
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function CatalogProductCard({
  product,
  viewMode,
}: CatalogProductCardProps) {
  const dispatch = useAppDispatch();
  const { openCart } = useCartUi();
  const [quickOpen, setQuickOpen] = useState(false);

  const lineId = cartLineId(product.id, product.defaultVariantId);
  const cartItem = useAppSelector((state) =>
    state.cart.items.find((item) => item.id === lineId),
  );
  const cartQty = cartItem?.quantity ?? 0;

  const href = `/products/${product.slug}`;
  const imageUrl =
    product.imageUrl || "https://placehold.co/600x600/png?text=SkinDx";
  const canAdd =
    Boolean(product.defaultVariantId) && product.quantity > 0;
  const compareAt = product.compareAtPrice ?? null;
  const discount = discountPercent(product.price, compareAt);
  const isList = viewMode === "list";

  function addToCart() {
    if (!product.defaultVariantId || product.quantity <= 0) {
      showError("This product is out of stock.", {
        id: "catalog.cart.error",
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
          originalUnitPriceInPaise:
            compareAt != null && compareAt > product.price
              ? rupeesToPaise(compareAt)
              : undefined,
          quantity: 1,
        }),
      );
      showSuccess("Added to cart.", { id: "catalog.cart" });
      openCart();
    } catch {
      showError("Could not add to cart. Please try again.", {
        id: "catalog.cart.error",
      });
    }
  }

  function setQuantity(next: number) {
    if (!cartItem) return;
    if (next <= 0) {
      dispatch(removeCartItem(lineId));
      return;
    }
    const capped = Math.min(next, Math.max(product.quantity, 1));
    dispatch(updateCartItemQuantity({ id: lineId, quantity: capped }));
  }

  const priceBlock = (
    <div className="flex flex-wrap items-baseline gap-2">
      <span
        className={cn(
          "text-lg font-bold",
          discount ? "text-primary" : "text-foreground",
        )}
      >
        {formatInr(product.price)}
      </span>
      {discount && compareAt != null ? (
        <span className="text-sm text-muted-foreground line-through">
          {formatInr(compareAt)}
        </span>
      ) : null}
    </div>
  );

  const cartControls =
    cartQty > 0 ? (
      <div className="inline-flex w-full items-center justify-between rounded-full border border-border bg-background px-1">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-9 rounded-full"
          aria-label="Decrease quantity"
          onClick={() => setQuantity(cartQty - 1)}
        >
          <Minus className="size-3.5" />
        </Button>
        <span className="min-w-8 text-center text-sm font-semibold tabular-nums">
          {cartQty}
        </span>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-9 rounded-full"
          aria-label="Increase quantity"
          disabled={cartQty >= product.quantity}
          onClick={() => setQuantity(cartQty + 1)}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
    ) : (
      <Button
        type="button"
        className="w-full rounded-full font-semibold"
        disabled={!canAdd}
        onClick={addToCart}
      >
        {canAdd ? "Add To Cart" : "Out of stock"}
      </Button>
    );

  const media = (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-surface",
        isList ? "size-28 shrink-0 sm:size-36" : "aspect-square w-full",
      )}
    >
      <Link
        href={href}
        className="absolute inset-0 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-contain p-3 transition-transform duration-300 group-hover:scale-[1.04]"
          sizes={
            isList
              ? "144px"
              : "(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          }
        />
      </Link>

      {discount ? (
        <span className="absolute top-2 left-2 rounded-md bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
          -{discount}%
        </span>
      ) : null}

      <Button
        type="button"
        size="icon"
        variant="secondary"
        className={cn(
          "absolute top-2 right-2 z-10 size-9 rounded-full border-2 border-foreground/40 bg-card text-foreground shadow-sm",
          "translate-x-1 opacity-0 transition-all duration-200",
          "group-hover:translate-x-0 group-hover:opacity-100 focus-visible:translate-x-0 focus-visible:opacity-100",
          "hover:border-foreground hover:bg-foreground hover:text-background",
        )}
        aria-label={`Quick look ${product.name}`}
        onClick={() => setQuickOpen(true)}
      >
        <Eye className="size-3.5" />
      </Button>
    </div>
  );

  const details = (
    <div className={cn("min-w-0", isList ? "flex-1 self-center" : "mt-3")}>
      <p className="text-[11px] font-semibold tracking-[0.08em] text-primary uppercase">
        {product.categoryName ?? "Product"}
      </p>
      <Link
        href={href}
        className={cn(
          "mt-1 block font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isList
            ? "line-clamp-2 text-base sm:text-lg"
            : "line-clamp-2 text-base leading-snug",
        )}
      >
        {product.name}
      </Link>
      <div className="mt-2">
        <ProductRatingStars
          averageRating={product.averageRating}
          reviewCount={product.reviewCount}
        />
      </div>
      {!isList ? <div className="mt-2">{priceBlock}</div> : null}
    </div>
  );

  return (
    <>
      <article
        className={cn(
          "group rounded-xl border border-border bg-card p-3 shadow-none transition-[border-color,box-shadow] duration-300 hover:border-primary hover:shadow-sm",
          isList
            ? "flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch"
            : "flex h-full flex-col",
        )}
      >
        {media}
        {details}
        {isList ? (
          <div className="flex w-full shrink-0 flex-col justify-center gap-3 border-t border-border pt-3 sm:w-44 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4">
            {priceBlock}
            {cartControls}
          </div>
        ) : (
          <div className="mt-auto pt-3">{cartControls}</div>
        )}
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

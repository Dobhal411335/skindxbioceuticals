"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Eye, Heart, Minus, Plus, ShoppingCart } from "lucide-react";

import {
  ProductDiscountBadge,
  ProductPriceDisplay,
} from "@/components/catalog/product-price-display";
import { ProductQuickView } from "@/components/landing/product-quick-view";
import { ProductRatingStars } from "@/components/landing/product-rating-stars";
import { useCartUi } from "@/components/cart/cart-ui-context";
import { Button } from "@/components/ui/button";
import {
  buildCartPricingFields,
  discountPercentForBadge,
  priceProductForRole,
} from "@/features/products/product-pricing";
import { useCartActions } from "@/hooks/useCartActions";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useIsVendor } from "@/hooks/useIsVendor";
import { useWishlistActions } from "@/hooks/useWishlistActions";
import { plainTextForShare } from "@/lib/share-text";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { CatalogViewMode, PublicProductCard } from "@/types/product";

type CatalogProductCardProps = {
  product: PublicProductCard;
  viewMode: CatalogViewMode;
};

function cartLineId(productId: string, variantId?: string | null) {
  return `${productId}:${variantId ?? "default"}`;
}

export function CatalogProductCard({
  product,
  viewMode,
}: CatalogProductCardProps) {
  const { openCart } = useCartUi();
  const { add: addToCartAction, setQuantity, remove } = useCartActions();
  const {
    toggle: toggleWishlist,
    isInWishlist,
    authLoading: wishlistAuthLoading,
  } = useWishlistActions();
  const [quickOpen, setQuickOpen] = useState(false);
  const [wishlistPending, setWishlistPending] = useState(false);
  const isVendor = useIsVendor();

  const lineId = cartLineId(product.id, product.defaultVariantId);
  const cartItem = useAppSelector((state) =>
    state.cart.items.find(
      (item) =>
        item.id === lineId ||
        (item.productId === product.id &&
          item.variantId === product.defaultVariantId),
    ),
  );
  const cartQty = cartItem?.quantity ?? 0;

  const href = `/products/${product.slug}`;
  const imageUrl =
    product.imageUrl || "https://placehold.co/600x600/png?text=SkinDx";
  const inWishlist = isInWishlist(product.id);
  const canAdd =
    Boolean(product.defaultVariantId) && product.quantity > 0;
  const priced = priceProductForRole({
    price: product.price,
    vendorPrice: product.vendorPrice,
    isVendor,
    coupon: product.coupon ?? null,
  });
  const discount = discountPercentForBadge(priced);
  const isList = viewMode === "list";
  const descriptionExcerpt = isList
    ? plainTextForShare(product.description ?? "", 180)
    : "";

  async function addToCart() {
    if (!product.defaultVariantId || product.quantity <= 0) {
      showError("This product is out of stock.", {
        id: "catalog.cart.error",
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

  function onSetQuantity(next: number) {
    if (!cartItem) return;
    if (next <= 0) {
      void remove(cartItem.id);
      return;
    }
    const capped = Math.min(next, Math.max(product.quantity, 1));
    void setQuantity(cartItem.id, capped);
  }

  const priceBlock = (
    <ProductPriceDisplay
      price={product.price}
      vendorPrice={product.vendorPrice}
      isVendor={isVendor}
      coupon={product.coupon}
      priced={priced}
      showBadge={false}
      size="lg"
    />
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
          onClick={() => onSetQuantity(cartQty - 1)}
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
          onClick={() => onSetQuantity(cartQty + 1)}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
    ) : (
      <Button
        type="button"
        className="w-full rounded font-semibold py-5"
        disabled={!canAdd}
        onClick={() => void addToCart()}
      >
        {canAdd ? "Add To Cart" : "Out of stock"}
        <ShoppingCart className="size-4 mr-2 inline-block" />
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
          className="object-contain transition-transform duration-300 group-hover:scale-[1.04]"
          sizes={
            isList
              ? "144px"
              : "(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          }
        />
      </Link>

      {discount != null ? (
        <ProductDiscountBadge
          percent={discount}
          className="absolute top-2 left-2 z-10"
        />
      ) : null}

      <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
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
          aria-label={`Quick look ${product.name}`}
          onClick={() => setQuickOpen(true)}
        >
          <Eye className="size-3.5" />
        </Button>
      </div>
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
      {isList && descriptionExcerpt ? (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {descriptionExcerpt}
        </p>
      ) : null}
      {!isList ? <div className="mt-2">{priceBlock}</div> : null}
    </div>
  );

  return (
    <>
      <article
        className={cn(
          "group rounded-xl border border-gray-600 bg-card p-3 shadow-none transition-[border-color,box-shadow] duration-300 hover:border-primary hover:shadow-sm",
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

"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Eye, Heart, ShoppingCart, Star } from "lucide-react";

import { ProductPriceDisplay } from "@/components/catalog/product-price-display";
import { ProductQuickView } from "@/components/landing/product-quick-view";
import { useCartUi } from "@/components/cart/cart-ui-context";
import { Button } from "@/components/ui/button";
import { buildCartPricingFields, priceProductForRole } from "@/features/products/product-pricing";
import { useCartActions } from "@/hooks/useCartActions";
import { useIsVendor } from "@/hooks/useIsVendor";
import { useWishlistActions } from "@/hooks/useWishlistActions";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { PublicProductCard } from "@/types/product";

type StorefrontProductCardProps = {
  product: PublicProductCard;
  className?: string;
};

export function StorefrontProductCard({ product, className }: StorefrontProductCardProps) {
  const { openCart } = useCartUi();
  const { add: addToCartAction } = useCartActions();
  const {
    toggle: toggleWishlist,
    isInWishlist,
    authLoading: wishlistAuthLoading,
  } = useWishlistActions();
  const [quickOpen, setQuickOpen] = useState(false);
  const [wishlistPending, setWishlistPending] = useState(false);
  const isVendor = useIsVendor();

  const href = `/products/${product.slug}`;
  const imageUrl = product.imageUrl || "https://placehold.co/600x600/png?text=SkinDx";
  const inWishlist = isInWishlist(product.id);
  const canAdd = Boolean(product.defaultVariantId) && product.quantity > 0;
  const priced = priceProductForRole({
    price: product.price,
    vendorPrice: product.vendorPrice,
    isVendor,
    coupon: product.coupon ?? null,
  });

  async function addToCart() {
    if (!product.defaultVariantId || product.quantity <= 0) {
      showError("This product is out of stock.", { id: "rail.cart.error" });
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
        price: String(priced.unitPrice),
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
    <>
      <article
        className={cn(
          "group flex h-full flex-col rounded-[8px] border border-[#e9e9e6] bg-card p-3.5 shadow-[0_1px_2px_rgb(20_35_45_/_.03)] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_8px_24px_rgb(20_35_45_/_.08)]",
          className,
        )}
      >
        <div className="relative aspect-square overflow-hidden rounded-[4px] bg-[#f1f2f0]">
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

          <div className="absolute top-2.5 right-2.5 flex flex-col gap-2">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className={cn(
                "size-8 rounded-full border border-[#d9dfdc] bg-card/95 shadow-sm transition-colors duration-200",
                inWishlist
                  ? "border-primary text-primary opacity-100"
                  : "text-foreground/70 hover:border-primary hover:bg-primary hover:text-primary-foreground",
              )}
              aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
              disabled={wishlistPending || wishlistAuthLoading}
              onClick={() => void onWishlist()}
            >
              <Heart className={cn("size-4", inWishlist ? "fill-primary" : "")} />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="size-8 rounded-full border border-[#d9dfdc] bg-card/95 text-foreground/70 opacity-0 shadow-sm transition-all duration-200 group-hover:opacity-100 focus-visible:opacity-100 hover:border-primary hover:bg-primary hover:text-primary-foreground"
              aria-label="Quick look"
              onClick={() => setQuickOpen(true)}
            >
              <Eye className="size-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-1.5 px-0.5">
          <p className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            {product.categoryName ?? "Product"}
          </p>
          <Link
            href={href}
            className="line-clamp-2 min-h-8 ellipsis text-md leading-[1.35] font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {product.name}
          </Link>
          {product.description ? (
            <p className="line-clamp-2 min-h-5 text-xs leading-relaxed text-muted-foreground">
              {product.description
                .replace(/<[^>]*>/g, " ")
                .replace(/\s+/g, " ")
                .trim()}
            </p>
          ) : (
            <p className="min-h-10 text-xs leading-relaxed text-muted-foreground">
              Everyday care formulated for comfortable, healthy-looking skin.
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
          <ProductPriceDisplay
            price={product.price}
            vendorPrice={product.vendorPrice}
            isVendor={isVendor}
            coupon={product.coupon}
            priced={priced}
            showBadge={false}
            size="lg"
            className="mt-4 [&>span:first-child]:!text-lg [&>span:first-child]:!text-foreground"
          />

          <div
            className="mt-2 flex items-center justify-end gap-1 text-md text-primary"
            aria-label={
              product.reviewCount > 0
                ? `Rated ${product.averageRating} out of 5 from ${product.reviewCount} reviews`
                : "No reviews yet"
            }
          >
            <Star className="size-3.5 fill-current" aria-hidden />
            <span>{product.averageRating.toFixed(1)}</span>
          </div>
          </div>

          <Button
            type="button"
            className={cn(
              "mt-3 w-full rounded-[3px] py-5 text-sm font-semibold transition-colors duration-300",
              canAdd ? "bg-primary text-primary-foreground" : "",
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

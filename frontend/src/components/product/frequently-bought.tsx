"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { Eye, Heart, Plus, ShoppingCart } from "lucide-react";

import {
  ProductDiscountBadge,
  ProductPriceDisplay,
} from "@/components/catalog/product-price-display";
import { useCartUi } from "@/components/cart/cart-ui-context";
import { ProductQuickView } from "@/components/landing/product-quick-view";
import { ProductRatingStars } from "@/components/landing/product-rating-stars";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  applyProductCoupon,
  buildCartPricingFields,
  discountPercentForBadge,
} from "@/features/products/product-pricing";
import { useCartActions } from "@/hooks/useCartActions";
import { useWishlistActions } from "@/hooks/useWishlistActions";
import { showError, showSuccess } from "@/lib/toast";
import { cn, formatInr } from "@/lib/utils";
import type { PublicProductDetail, PublicRelatedProduct } from "@/types/product";

type FrequentlyBoughtProps = {
  product: PublicProductDetail;
};

export function FrequentlyBought({ product }: FrequentlyBoughtProps) {
  // Same subcategory only; current product is already excluded by the API.
  const bundle = product.relatedProducts;

  const { add: addToCartAction } = useCartActions();
  const { openCart } = useCartUi();
  const {
    toggle: toggleWishlist,
    isInWishlist,
    authLoading: wishlistAuthLoading,
  } = useWishlistActions();
  const [wishlistPendingId, setWishlistPendingId] = useState<string | null>(null);
  const [cartPendingId, setCartPendingId] = useState<string | null>(null);
  const [quickView, setQuickView] = useState<{
    slug: string;
    categoryName: string | null;
  } | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(bundle.map((item) => [item.id, true])),
  );

  const selectedItems = useMemo(
    () => bundle.filter((item) => selected[item.id]),
    [bundle, selected],
  );

  const total = selectedItems.reduce((sum, item) => {
    const priced = applyProductCoupon(item.price, item.coupon ?? null);
    return sum + priced.unitPrice;
  }, 0);

  async function addItemToCart(item: PublicRelatedProduct): Promise<boolean> {
    if (!item.defaultVariantId || item.quantity <= 0) {
      showError("This product is out of stock.", { id: "fbt.cart.error" });
      return false;
    }
    const pricing = buildCartPricingFields(item.price, item.coupon ?? null);
    return addToCartAction({
      productId: item.id,
      variantId: item.defaultVariantId,
      slug: item.slug,
      name: item.name,
      image: item.imageUrl ?? "",
      alt: item.name,
      categoryName: item.categoryName,
      unitPriceInPaise: pricing.unitPriceInPaise,
      originalUnitPriceInPaise: pricing.originalUnitPriceInPaise,
      discountCode: pricing.discountCode,
      discountInPaise: pricing.discountInPaise,
      cgstPercent: item.tax?.cgst ?? 0,
      sgstPercent: item.tax?.sgst ?? 0,
      quantity: 1,
    });
  }

  async function onAddToCart(item: PublicRelatedProduct) {
    if (cartPendingId) return;
    setCartPendingId(item.id);
    try {
      const ok = await addItemToCart(item);
      if (ok) openCart();
    } finally {
      setCartPendingId(null);
    }
  }

  async function onWishlist(item: PublicRelatedProduct) {
    if (wishlistPendingId || wishlistAuthLoading) return;
    setWishlistPendingId(item.id);
    try {
      await toggleWishlist({
        productId: item.id,
        variantId: item.defaultVariantId,
        productName: item.name,
        productSlug: item.slug,
        categoryName: item.categoryName,
        imageUrl: item.imageUrl,
        price: String(item.price),
        currency: "INR",
        available: item.quantity > 0,
        quantity: item.quantity,
        cgstPercent: item.tax?.cgst ?? 0,
        sgstPercent: item.tax?.sgst ?? 0,
        coupon: item.coupon ?? null,
      });
    } finally {
      setWishlistPendingId(null);
    }
  }

  async function addAll() {
    if (selectedItems.length === 0) {
      showError("Select at least one product.", { id: "cart.add.bundle.empty" });
      return;
    }

    let added = 0;
    for (const item of selectedItems) {
      if (!item.defaultVariantId || item.quantity <= 0) continue;
      const ok = await addItemToCart(item);
      if (ok) added += 1;
    }

    if (added > 0) {
      showSuccess(
        added === 1
          ? "Added selected item to cart."
          : `Added ${added} selected items to cart.`,
        { id: "cart.add.bundle" },
      );
      openCart();
      return;
    }

    showError("Could not add items to cart.", { id: "cart.add.error" });
  }

  if (bundle.length === 0) return null;

  return (
    <section className="w-full section-space bg-primary/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="font-sans-serif text-3xl font-semibold mb-8">
          Frequently bought together
        </h2>
        <div className="flex flex-col xl:flex-row gap-8 items-start w-full">
          <div className="flex-1 flex flex-wrap items-stretch gap-4 sm:gap-5">
            {bundle.map((item, index) => {
              const priced = applyProductCoupon(item.price, item.coupon ?? null);
              const discountPercent = discountPercentForBadge(priced);
              const imageUrl =
                item.imageUrl ||
                "https://placehold.co/600x600/png?text=SkinDx";
              const checked = Boolean(selected[item.id]);
              const canAdd =
                Boolean(item.defaultVariantId) && item.quantity > 0;
              const inWishlist = isInWishlist(item.id);
              const href = `/products/${item.slug}`;

              return (
                <Fragment key={item.id}>
                  {index > 0 ? (
                    <Plus
                      className="hidden lg:block size-5 shrink-0 self-center text-muted-foreground"
                      aria-hidden
                    />
                  ) : null}
                  <article
                    className={cn(
                      "group relative flex w-full max-w-[280px] flex-col rounded-xl border bg-card p-2 shadow-none transition-[border-color,box-shadow,opacity] duration-300 sm:w-[260px]",
                      checked
                        ? "border-border hover:border-primary hover:shadow-sm"
                        : "border-border/70 opacity-70",
                    )}
                  >
                    <div className="absolute top-3 left-3 z-20">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) =>
                          setSelected((prev) => ({
                            ...prev,
                            [item.id]: value === true,
                          }))
                        }
                        aria-label={`Include ${item.name} in bundle`}
                        className="size-5 border-2 bg-card shadow-sm data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </div>

                    <div className="relative aspect-square overflow-hidden rounded-lg bg-surface">
                      <Link
                        href={href}
                        className="absolute inset-0 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Image
                          src={imageUrl}
                          alt={item.name}
                          fill
                          className="object-contain transition-transform duration-300 group-hover:scale-[1.04]"
                          sizes="(max-width: 640px) 80vw, 260px"
                        />
                      </Link>

                      {discountPercent != null ? (
                        <ProductDiscountBadge
                          percent={discountPercent}
                          className="absolute top-2 left-10 z-10"
                        />
                      ) : null}

                      <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-2">
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
                          aria-label={
                            inWishlist
                              ? "Remove from wishlist"
                              : "Add to wishlist"
                          }
                          disabled={
                            wishlistPendingId === item.id || wishlistAuthLoading
                          }
                          onClick={() => void onWishlist(item)}
                        >
                          <Heart
                            className={cn(
                              "size-3.5",
                              inWishlist ? "fill-primary" : "",
                            )}
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
                          onClick={() =>
                            setQuickView({
                              slug: item.slug,
                              categoryName: item.categoryName,
                            })
                          }
                        >
                          <Eye className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-1 flex-col gap-2 px-0.5">
                      <p className="text-[11px] font-semibold tracking-[0.08em] text-primary uppercase">
                        {item.categoryName ?? "Product"}
                      </p>
                      <Link
                        href={href}
                        className="line-clamp-2 text-base leading-snug font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {item.name}
                      </Link>
                      <ProductRatingStars
                        averageRating={item.averageRating}
                        reviewCount={item.reviewCount}
                        className="text-foreground"
                      />
                      <ProductPriceDisplay
                        price={item.price}
                        coupon={item.coupon}
                        priced={priced}
                        showBadge={false}
                        size="lg"
                      />

                      <Button
                        type="button"
                        className={cn(
                          "mt-auto w-full rounded-full p-5 font-semibold transition-colors duration-300",
                          canAdd ? "bg-primary text-primary-foreground" : "",
                        )}
                        disabled={!canAdd || cartPendingId === item.id}
                        onClick={() => void onAddToCart(item)}
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
                </Fragment>
              );
            })}
          </div>

          <div className="w-full max-w-sm flex-shrink-0 xl:sticky xl:top-24">
            <div className="bg-card rounded-xl border border-border px-8 py-6 flex flex-col gap-5 shadow-sm justify-center">
              <div className="flex flex-col items-center justify-center">
                <p className="text-xl font-semibold text-black">
                  Total for selected
                </p>
                <span className="font-bold text-3xl mt-1 block text-black">
                  {formatInr(total)}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedItems.length} product
                  {selectedItems.length === 1 ? "" : "s"} selected
                </p>
              </div>
              <Button
                size="lg"
                className="w-full mt-2 rounded-full border border-gray-500 hover:bg-primary hover:text-white cursor-pointer"
                type="button"
                onClick={() => void addAll()}
              >
                <ShoppingCart className="size-4" />
                Add selected to cart
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ProductQuickView
        slug={quickView?.slug ?? null}
        categoryName={quickView?.categoryName}
        open={Boolean(quickView)}
        onOpenChange={(open) => {
          if (!open) setQuickView(null);
        }}
      />
    </section>
  );
}

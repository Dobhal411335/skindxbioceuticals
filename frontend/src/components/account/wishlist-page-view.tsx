"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, ShoppingCart, X } from "lucide-react";

import {
  ProductDiscountBadge,
  ProductPriceDisplay,
} from "@/components/catalog/product-price-display";
import { useCartUi } from "@/components/cart/cart-ui-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchProductBySlugClient } from "@/features/products/product.service";
import {
  applyProductCoupon,
  buildCartPricingFields,
  discountPercentForBadge,
  stockQtyBadgeClass,
} from "@/features/products/product-pricing";
import type { WishlistItem } from "@/features/wishlist/wishlist.types";
import { wishlistService } from "@/features/wishlist/wishlist.service";
import { useAuth } from "@/hooks/useAuth";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useCartActions } from "@/hooks/useCartActions";
import { useWishlistActions } from "@/hooks/useWishlistActions";
import { writeGuestWishlist } from "@/lib/guest-wishlist-storage";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { setWishlistItems } from "@/store/slices/wishlistSlice";

export function WishlistPageView() {
  const dispatch = useAppDispatch();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { items, remove, toggle } = useWishlistActions();
  const { add: addToCartAction } = useCartActions();
  const { openCart } = useCartUi();
  const status = useAppSelector((state) => state.wishlist.status);
  const hydrated = useAppSelector((state) => state.wishlist.hydrated);
  const error = useAppSelector((state) => state.wishlist.error);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [cartPendingId, setCartPendingId] = useState<string | null>(null);
  const [stockRefreshDone, setStockRefreshDone] = useState(false);

  // Wait for auth bootstrap + CartWishlistSyncBridge hydrate before empty state.
  const loading =
    authLoading ||
    !hydrated ||
    status === "syncing" ||
    status === "loading";

  useEffect(() => {
    setStockRefreshDone(false);
  }, [isAuthenticated]);

  // Refresh stock qty: API for signed-in users; PDP fill for guest bags missing quantity.
  useEffect(() => {
    if (loading || items.length === 0 || stockRefreshDone) return;

    let cancelled = false;

    void (async () => {
      if (isAuthenticated) {
        try {
          const wishlist = await wishlistService.get();
          if (!cancelled) {
            dispatch(setWishlistItems(wishlist.items));
            setStockRefreshDone(true);
          }
        } catch {
          if (!cancelled) setStockRefreshDone(true);
        }
        return;
      }

      const missing = items.filter(
        (item) => typeof item.quantity !== "number" && Boolean(item.productSlug),
      );
      if (missing.length === 0) {
        setStockRefreshDone(true);
        return;
      }

      const qtyByProductId = new Map<string, number>();
      await Promise.all(
        missing.map(async (item) => {
          const detail = await fetchProductBySlugClient(item.productSlug);
          if (!detail) return;
          const variant =
            (item.variantId
              ? detail.variants.find((row) => row.id === item.variantId)
              : null) ?? detail.variants[0];
          qtyByProductId.set(item.productId, variant?.quantity ?? 0);
        }),
      );

      if (cancelled) return;

      if (qtyByProductId.size > 0) {
        const nextItems = items.map((item) => {
          const quantity = qtyByProductId.get(item.productId);
          if (typeof quantity !== "number") return item;
          return {
            ...item,
            quantity,
            available: quantity > 0,
          };
        });
        dispatch(setWishlistItems(nextItems));
        writeGuestWishlist(
          nextItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            productSlug: item.productSlug,
            imageUrl: item.imageUrl,
            price: item.price,
            currency: item.currency,
            available: item.available,
            quantity: item.quantity,
            coupon: item.coupon ?? null,
          })),
        );
      }
      setStockRefreshDone(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [dispatch, isAuthenticated, items, loading, stockRefreshDone]);

  const removeItem = async (itemId: string) => {
    if (pendingId) return;
    setPendingId(itemId);
    try {
      await remove(itemId);
    } finally {
      setPendingId(null);
    }
  };
  async function onAddToCart(item: WishlistItem) {
    if (cartPendingId) return;
    if (!item.variantId || !item.available) {
      showError("This product is out of stock.", { id: "wishlist.cart.error" });
      return;
    }
    const listPrice = item.price != null ? Number(item.price) : NaN;
    if (Number.isNaN(listPrice)) {
      showError("Price unavailable for this product.", {
        id: "wishlist.cart.price",
      });
      return;
    }

    setCartPendingId(item.id);
    try {
      const pricing = buildCartPricingFields(listPrice, item.coupon ?? null);
      const ok = await addToCartAction({
        productId: item.productId,
        variantId: item.variantId,
        slug: item.productSlug,
        name: item.productName,
        image: item.imageUrl ?? "",
        alt: item.productName,
        categoryName: item.categoryName ?? null,
        productCode: item.productCode ?? null,
        unitPriceInPaise: pricing.unitPriceInPaise,
        originalUnitPriceInPaise: pricing.originalUnitPriceInPaise,
        discountCode: pricing.discountCode,
        discountInPaise: pricing.discountInPaise,
        cgstPercent: item.cgstPercent ?? 0,
        sgstPercent: item.sgstPercent ?? 0,
        quantity: 1,
      });
      if (ok) openCart();
    } finally {
      setCartPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Wishlist</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Products you have saved for later.
          {!isAuthenticated ? " Sign in anytime to sync across devices." : null}
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : items.length === 0 ? (
        <Card className="border-border shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Heart className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Your wishlist is empty.</p>
            <Button asChild>
              <Link href="/category">Discover Products</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const listPrice = item.price != null ? Number(item.price) : NaN;
            const hasPrice = !Number.isNaN(listPrice);
            const priced = hasPrice
              ? applyProductCoupon(listPrice, item.coupon ?? null)
              : null;
            const discountPercent = priced
              ? discountPercentForBadge(priced)
              : null;
            // Prefer API/guest `quantity`; never treat a missing guest cache value as 0 stock.
            const qtyLeft =
              typeof item.quantity === "number" ? item.quantity : null;
            const inStock =
              qtyLeft != null ? qtyLeft > 0 : Boolean(item.available);
            const canAdd = Boolean(item.variantId) && inStock;

            return (
              <article
                key={item.id}
                className="group flex flex-col rounded-xl border border-gray-500 bg-card p-2 shadow-none transition-[border-color,box-shadow] duration-300 hover:border-primary hover:shadow-sm"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-surface">
                  {item.productSlug ? (
                    <Link
                      href={`/products/${item.productSlug}`}
                      className="absolute inset-0 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          className="object-contain transition-transform duration-300 group-hover:scale-[1.04]"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-base text-muted-foreground">
                          No image
                        </div>
                      )}
                    </Link>
                  ) : item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      className="object-contain transition-transform duration-300 group-hover:scale-[1.04]"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-base text-muted-foreground">
                      No image
                    </div>
                  )}

                  {discountPercent != null ? (
                    <ProductDiscountBadge
                      percent={discountPercent}
                      className="absolute top-2 left-2 z-10"
                    />
                  ) : null}
                </div>

                <div className="mt-4 flex flex-1 flex-col gap-2 px-0.5">
                  <h2 className="line-clamp-2 text-base leading-snug font-semibold">
                    {item.productSlug ? (
                      <Link
                        href={`/products/${item.productSlug}`}
                        className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {item.productName}
                      </Link>
                    ) : (
                      item.productName
                    )}
                  </h2>

                  {hasPrice && priced ? (
                    <ProductPriceDisplay
                      price={listPrice}
                      coupon={item.coupon}
                      priced={priced}
                      showBadge={false}
                      size="md"
                    />
                  ) : (
                    <p className="text-sm font-medium text-muted-foreground">
                      Price unavailable
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span
                      className={cn(
                        "font-bold",
                        inStock ? "text-success" : "text-destructive",
                      )}
                    >
                      {inStock ? "In stock" : "Out of stock"}
                    </span>
                    {qtyLeft != null ? (
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums",
                          stockQtyBadgeClass(qtyLeft),
                        )}
                      >
                        {qtyLeft} left
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-auto flex gap-2 pt-2">
                    {item.productSlug ? (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="flex-1 min-w-0 rounded-full p-5"
                      >
                        <Link href={`/products/${item.productSlug}`}>
                          View Details
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                        className="flex-1 min-w-0 rounded-full p-5"
                      >
                        Details Unavailable
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive px-2 p-5"
                      disabled={pendingId === item.id}
                      aria-label="Remove"
                      onClick={() => void removeItem(item.id)}
                    >
                      <X className="size-4" />
                      {pendingId === item.id ? "Removing…" : "Delete"}
                    </Button>
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
            );
          })}
        </div>
      )}
    </div>
  );
}

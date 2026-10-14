"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart } from "lucide-react";

import {
  ProductDiscountBadge,
  ProductPriceDisplay,
} from "@/components/catalog/product-price-display";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  applyProductCoupon,
  discountPercentForBadge,
} from "@/features/products/product-pricing";
import { useAuth } from "@/hooks/useAuth";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useWishlistActions } from "@/hooks/useWishlistActions";

export function WishlistPageView() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { items, remove } = useWishlistActions();
  const status = useAppSelector((state) => state.wishlist.status);
  const hydrated = useAppSelector((state) => state.wishlist.hydrated);
  const error = useAppSelector((state) => state.wishlist.error);
  const [pendingId, setPendingId] = useState<string | null>(null);

  // Wait for auth bootstrap + CartWishlistSyncBridge hydrate before empty state.
  const loading =
    authLoading ||
    !hydrated ||
    status === "syncing" ||
    status === "loading";

  const removeItem = async (itemId: string) => {
    if (pendingId) return;
    setPendingId(itemId);
    try {
      await remove(itemId);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Wishlist</h1>
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

            return (
              <Card
                key={item.id}
                className="overflow-hidden border-border shadow-none"
              >
                <div className="relative aspect-square bg-surface">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
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
                <CardContent className="space-y-2 p-4">
                  <h2 className="text-sm font-semibold">{item.productName}</h2>
                  {hasPrice && priced ? (
                    <ProductPriceDisplay
                      price={listPrice}
                      coupon={item.coupon}
                      priced={priced}
                      showBadge={false}
                      size="md"
                    />
                  ) : (
                    <p className="text-sm font-medium">Price unavailable</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {item.available ? "In stock" : "Currently unavailable"}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {item.productSlug ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/products/${item.productSlug}`}>
                          View product
                        </Link>
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pendingId === item.id}
                      onClick={() => void removeItem(item.id)}
                    >
                      {pendingId === item.id ? "Removing…" : "Remove"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

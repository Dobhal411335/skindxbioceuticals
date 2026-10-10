"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { wishlistService } from "@/features/wishlist/wishlist.service";
import type { WishlistItem } from "@/features/wishlist/wishlist.types";
import { toApiError } from "@/services/api/errors";

function formatMoney(amount: string | null, currency: string | null) {
  if (amount == null) return "Price unavailable";
  const value = Number(amount);
  if (Number.isNaN(value)) return `${currency ?? ""} ${amount}`.trim();
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
  }).format(value);
}

export function WishlistPageView() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const wishlist = await wishlistService.get();
        if (!cancelled) setItems(wishlist.items);
      } catch (err) {
        if (!cancelled) {
          setError(toApiError(err).message || "Unable to load wishlist.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const removeItem = async (itemId: string) => {
    if (pendingId) return;
    setPendingId(itemId);
    setError(null);
    try {
      await wishlistService.remove(itemId);
      setItems((current) => current.filter((item) => item.id !== itemId));
    } catch (err) {
      setError(toApiError(err).message || "Unable to remove item.");
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
              <Link href="/shop">Discover Products</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden border-border shadow-none">
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
              </div>
              <CardContent className="space-y-2 p-4">
                <h2 className="text-sm font-semibold">{item.productName}</h2>
                <p className="text-sm font-medium">
                  {formatMoney(item.price, item.currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.available ? "In stock" : "Currently unavailable"}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/shop/${item.productSlug}`}>View product</Link>
                  </Button>
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
          ))}
        </div>
      )}
    </div>
  );
}

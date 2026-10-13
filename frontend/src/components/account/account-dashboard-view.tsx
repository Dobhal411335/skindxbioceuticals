"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, MapPin, Package, UserRound } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserDisplayName } from "@/features/auth/auth-user";
import { meService } from "@/features/me/me.service";
import type { Address } from "@/features/me/me.types";
import { orderService } from "@/features/orders/order.service";
import type { CustomerOrderListItem } from "@/features/orders/order.types";
import { useAuth } from "@/hooks/useAuth";
import { useAppSelector } from "@/hooks/useAppSelector";
import { toApiError } from "@/services/api/errors";
import { selectWishlistCount } from "@/store/slices/wishlistSlice";

function formatMoney(amount: string, currency: string) {
  const value = Number(amount);
  if (Number.isNaN(value)) {
    return `${currency} ${amount}`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
  }).format(value);
}

export function AccountDashboardView() {
  const { user } = useAuth();
  const wishlistCount = useAppSelector(selectWishlistCount);
  const [orders, setOrders] = useState<CustomerOrderListItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [ordersResult, addressList] = await Promise.all([
          orderService.list({ page: 1, pageSize: 3 }),
          meService.listAddresses(),
        ]);
        if (cancelled) return;
        setOrders(ordersResult.orders);
        setAddresses(addressList);
      } catch (err) {
        if (!cancelled) {
          setError(toApiError(err).message || "Unable to load account overview.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = user ? getUserDisplayName(user) : "there";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
          Welcome, {displayName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review recent orders, wishlist items, and saved addresses from your account.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Orders",
            value: loading ? null : String(orders.length),
            href: "/account/orders",
            icon: Package,
          },
          {
            label: "Wishlist",
            value: String(wishlistCount),
            href: "/wishlist",
            icon: Heart,
          },
          {
            label: "Addresses",
            value: loading ? null : String(addresses.length),
            href: "/account/addresses",
            icon: MapPin,
          },
          {
            label: "Account",
            value: "Details",
            href: "/account/details",
            icon: UserRound,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.href} className="border-border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {item.label}
                </CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {item.value == null ? (
                  <Skeleton className="h-7 w-12" />
                ) : (
                  <p className="text-2xl font-semibold">{item.value}</p>
                )}
                <Button asChild variant="link" className="mt-2 h-auto px-0">
                  <Link href={item.href}>View</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Recent orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <>
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </>
            ) : orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You haven&apos;t placed any orders yet.
              </p>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.status} · {formatMoney(order.grandTotal, order.currency)}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/account/orders/${order.id}`}>View</Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Wishlist summary</CardTitle>
          </CardHeader>
          <CardContent>
            {wishlistCount === 0 ? (
              <p className="text-sm text-muted-foreground">Your wishlist is empty.</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                You have {wishlistCount} saved{" "}
                {wishlistCount === 1 ? "product" : "products"}.
              </p>
            )}
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/wishlist">Open wishlist</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

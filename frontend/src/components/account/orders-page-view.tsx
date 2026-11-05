"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Package } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { orderService } from "@/features/orders/order.service";
import type { CustomerOrderListItem } from "@/features/orders/order.types";
import { toApiError } from "@/services/api/errors";

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

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function OrdersPageView() {
  const [orders, setOrders] = useState<CustomerOrderListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await orderService.list({ page, pageSize: 10 });
        if (cancelled) return;
        setOrders(data.orders);
        setTotalPages(data.totalPages);
      } catch (err) {
        if (!cancelled) {
          setError(toApiError(err).message || "Unable to load orders.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Your Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Orders placed on your SkinDx account.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : orders.length === 0 ? (
        <Card className="border-border shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Package className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              You haven&apos;t placed any orders yet.
            </p>
            <Button asChild>
              <Link href="/category">Start Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id} className="border-border shadow-none">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="font-semibold">{order.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(order.placedAt ?? order.createdAt)} · {order.itemCount}{" "}
                    {order.itemCount === 1 ? "item" : "items"}
                  </p>
                  <p className="text-sm">
                    {formatMoney(order.grandTotal, order.currency)} · {order.status}
                    {order.paymentStatus ? ` · Payment ${order.paymentStatus}` : ""}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/account/orders/${order.id}`}>View order details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

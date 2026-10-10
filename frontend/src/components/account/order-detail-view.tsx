"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { orderService } from "@/features/orders/order.service";
import type { CustomerOrderDetail } from "@/features/orders/order.types";
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

export function OrderDetailView({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await orderService.getById(orderId);
        if (!cancelled) setOrder(data);
      } catch (err) {
        if (!cancelled) {
          setError(toApiError(err).message || "Unable to load this order.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">Order details</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/account/orders">Back to orders</Link>
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading || !order ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-base">{order.orderNumber}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {order.status}
              {order.paymentStatus ? ` · Payment ${order.paymentStatus}` : ""}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between gap-3 border-b border-border py-2 text-sm last:border-0"
                >
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-muted-foreground">
                      {item.variantName} · Qty {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">
                    {formatMoney(item.lineTotal, order.currency)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatMoney(order.subtotal, order.currency)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatMoney(order.grandTotal, order.currency)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

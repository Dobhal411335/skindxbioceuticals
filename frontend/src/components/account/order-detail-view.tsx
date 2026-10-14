"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Package,
  ShoppingBag,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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

function formatDate(isoString: string | null) {
  if (!isoString) return null;
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(isoString));
  } catch {
    return null;
  }
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
      {/* Top Header & Back Button */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Order details
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Review your order status, items, and billing details
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-1.5 shadow-xs">
          <Link href="/account/orders">
            <ArrowLeft className="size-4" />
            <span>Back to orders</span>
          </Link>
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading || !order ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Card 1: Order Status & Metadata Card (bg-white) */}
          <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-sm sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Order number
                </span>
                <p className="text-lg font-bold text-foreground">
                  #{order.orderNumber}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  {order.status}
                </span>
                {order.paymentStatus ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-xs font-medium text-foreground">
                    <CreditCard className="size-3.5 text-muted-foreground" />
                    Payment: {order.paymentStatus}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                <span>
                  Placed on:{" "}
                  <span className="font-medium text-foreground">
                    {formatDate(order.placedAt || order.createdAt) || "Recent"}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="size-4 text-muted-foreground" />
                <span>
                  Total items:{" "}
                  <span className="font-medium text-foreground">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Ordered Items Card (bg-white) */}
          <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-sm sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="size-5 text-primary" />
                <h2 className="text-base font-semibold text-foreground">
                  Ordered items
                </h2>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {order.items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                {order.items.reduce((sum, item) => sum + item.quantity, 0) === 1
                  ? "item"
                  : "items"}
              </span>
            </div>

            <ul className="divide-y divide-border/60">
              {order.items.map((item) => {
                const unit = Number(item.unitPrice);
                const original =
                  item.originalUnitPrice != null
                    ? Number(item.originalUnitPrice)
                    : null;
                const hasDiscount =
                  original != null && original > unit && original > 0;
                const discountPercent = hasDiscount
                  ? Math.round(((original - unit) / original) * 100)
                  : 0;

                const imageUrl = item.image || item.imageUrl;

                return (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-4 py-4 first:pt-1 last:pb-1"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      {/* Show image only if the order item has an image; otherwise, do not show any image/placeholder */}
                      {imageUrl ? (
                        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted/20">
                          <Image
                            src={imageUrl}
                            alt={item.productName}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      ) : null}

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-snug">
                          {item.productName}
                        </p>
                        {item.variantName ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Variant:{" "}
                            <span className="font-medium text-foreground/80">
                              {item.variantName}
                            </span>
                          </p>
                        ) : null}
                        <div className="mt-1 flex flex-wrap items-baseline gap-2 text-xs">
                          <span className="font-medium text-foreground">
                            Qty: {item.quantity}
                          </span>
                          <span className="text-muted-foreground">·</span>
                          <span className="font-medium text-foreground">
                            {formatMoney(item.unitPrice, order.currency)} each
                          </span>
                          {hasDiscount ? (
                            <>
                              <span className="text-muted-foreground line-through">
                                {formatMoney(item.originalUnitPrice!, order.currency)}
                              </span>
                              <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                                {discountPercent}% off
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-foreground">
                        {formatMoney(item.lineTotal, order.currency)}
                      </p>
                      {hasDiscount ? (
                        <p className="text-xs text-muted-foreground line-through">
                          {formatMoney(
                            String((original! * item.quantity).toFixed(2)),
                            order.currency,
                          )}
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Card 3: Payment Summary Breakdown Card (bg-white) */}
          <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-sm sm:p-6 space-y-3 text-sm">
            <h3 className="border-b border-border/60 pb-3 text-sm font-semibold text-foreground">
              Payment summary
            </h3>

            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatMoney(order.subtotal, order.currency)}</span>
            </div>

            {Number(order.discountTotal) > 0 ? (
              <div className="flex justify-between font-medium text-emerald-700">
                <span>
                  Discount savings
                  {Number(order.subtotal) > 0
                    ? ` (${Math.round(
                        (Number(order.discountTotal) /
                          Number(order.subtotal)) *
                          100,
                      )}% off)`
                    : ""}
                </span>
                <span>
                  -{formatMoney(order.discountTotal, order.currency)}
                </span>
              </div>
            ) : null}

            {Number(order.cgstTotal ?? 0) > 0 ? (
              <div className="flex justify-between text-muted-foreground">
                <span>CGST</span>
                <span>{formatMoney(order.cgstTotal!, order.currency)}</span>
              </div>
            ) : null}

            {Number(order.sgstTotal ?? 0) > 0 ? (
              <div className="flex justify-between text-muted-foreground">
                <span>SGST</span>
                <span>{formatMoney(order.sgstTotal!, order.currency)}</span>
              </div>
            ) : null}

            {Number(order.taxTotal) > 0 &&
            !(
              Number(order.cgstTotal ?? 0) > 0 ||
              Number(order.sgstTotal ?? 0) > 0
            ) ? (
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>{formatMoney(order.taxTotal, order.currency)}</span>
              </div>
            ) : null}

            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span className="font-medium text-emerald-700">Free</span>
            </div>

            <div className="flex justify-between border-t border-border/80 pt-3 text-base font-bold text-foreground">
              <span>Grand total</span>
              <span>{formatMoney(order.grandTotal, order.currency)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

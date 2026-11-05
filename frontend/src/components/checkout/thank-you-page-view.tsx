"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  Package,
  ShoppingBag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { checkoutService } from "@/features/checkout/checkout.service";
import type { OrderConfirmationResult } from "@/features/checkout/checkout.types";
import { useAuth } from "@/hooks/useAuth";
import { formatInr } from "@/lib/utils";

const CONFIRMATION_TOKEN_KEY = "skindx_order_confirmation_token";

function parseShippingAddress(raw: unknown): {
  fullName?: string;
  line1?: string;
  line2?: string;
  cityStatePin?: string;
  phone?: string;
} | null {
  if (!raw || typeof raw !== "object") return null;
  const addr = raw as Record<string, unknown>;
  const firstName = typeof addr.firstName === "string" ? addr.firstName.trim() : "";
  const lastName = typeof addr.lastName === "string" ? addr.lastName.trim() : "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const line1 = typeof addr.line1 === "string" ? addr.line1.trim() : "";
  const line2 = typeof addr.line2 === "string" ? addr.line2.trim() : "";
  const city = typeof addr.city === "string" ? addr.city.trim() : "";
  const state = typeof addr.state === "string" ? addr.state.trim() : "";
  const postalCode = typeof addr.postalCode === "string" ? addr.postalCode.trim() : "";
  const cityStatePin = [city, state, postalCode].filter(Boolean).join(", ");
  const phone = typeof addr.phone === "string" ? addr.phone.trim() : "";

  if (!line1 && !fullName) return null;
  return { fullName, line1, line2, cityStatePin, phone };
}

function ThankYouContent() {
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const orderId = searchParams.get("orderId");
  const tokenFromQuery = searchParams.get("confirmationToken");

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderConfirmationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const confirmationToken =
          tokenFromQuery ||
          (typeof window !== "undefined"
            ? sessionStorage.getItem(CONFIRMATION_TOKEN_KEY)
            : null) ||
          undefined;

        if (!orderId && !confirmationToken) {
          setError("Missing order confirmation details.");
          return;
        }

        const data = await checkoutService.getConfirmation({
          orderId: orderId ?? undefined,
          confirmationToken,
        });

        if (cancelled) return;

        if (
          data.paymentStatus !== "CAPTURED" &&
          data.status === "PENDING"
        ) {
          // Attempt status reconciliation once
          if (orderId) {
            const status = await checkoutService.getPaymentStatus({
              orderId,
              guestSessionToken:
                typeof window !== "undefined"
                  ? sessionStorage.getItem("skindx_guest_checkout_token") ??
                    undefined
                  : undefined,
            });
            if (status.paymentStatus === "CAPTURED") {
              const refreshed = await checkoutService.getConfirmation({
                orderId,
                confirmationToken,
              });
              if (!cancelled) setOrder(refreshed);
              return;
            }
          }
        }

        setOrder(data);
      } catch {
        if (!cancelled) {
          setError(
            "We could not load this order confirmation. If you just paid, check your email or sign in with the same address.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [orderId, tokenFromQuery]);

  if (loading) {
    return (
      <div className="container-page section-space flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading your order…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container-page section-space max-w-lg text-center">
        <h1 className="text-2xl font-semibold">Order confirmation</h1>
        <p className="mt-3 text-muted-foreground">
          {error ?? "Order not found."}
        </p>
        <Button asChild className="mt-6">
          <Link href="/category">Continue shopping</Link>
        </Button>
      </div>
    );
  }

  const isPaid =
    order.paymentStatus === "CAPTURED" ||
    order.status === "CONFIRMED" ||
    order.status === "PROCESSING";

  const shippingAddr = parseShippingAddress(order.shippingAddress);

  return (
    <div className="container-page section-space max-w-3xl space-y-8">
      {/* Top Hero with Heartbeat Ripple Animation */}
      <div className="text-center">
        <div className="relative mx-auto mb-6 flex size-24 items-center justify-center">
          {isPaid ? (
            <>
              {/* Concentric heartbeat ripple rings */}
              <span
                className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/25 opacity-75 duration-1000"
                aria-hidden
              />
              <span
                className="absolute inline-flex size-20 animate-pulse rounded-full bg-emerald-500/20 duration-700"
                aria-hidden
              />
              <span
                className="absolute inline-flex size-28 rounded-full border border-emerald-500/25 animate-pulse"
                aria-hidden
              />
              <div className="relative flex size-16 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-green-500 text-white shadow-xl shadow-emerald-500/30 ring-4 ring-emerald-50 dark:ring-emerald-950">
                <CheckCircle2 className="size-9 stroke-[2.4]" aria-hidden />
              </div>
            </>
          ) : (
            <>
              <span
                className="absolute inline-flex size-full animate-pulse rounded-full bg-amber-500/20"
                aria-hidden
              />
              <div className="relative flex size-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 ring-4 ring-amber-50 dark:ring-amber-950">
                <Loader2 className="size-8 animate-spin" aria-hidden />
              </div>
            </>
          )}
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {isPaid ? "Thank you for your order!" : "Payment is processing"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {isPaid ? (
            <>
              Order <span className="font-semibold text-foreground">#{order.orderNumber}</span> has been confirmed.
            </>
          ) : (
            <>
              Order <span className="font-semibold text-foreground">#{order.orderNumber}</span> is awaiting confirmation.
            </>
          )}
        </p>
      </div>

      {/* Card 1: Order Metadata & Status Card */}
      <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Order status
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-block size-2 rounded-full ${
                  isPaid ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              <span className="font-medium text-foreground">{order.status}</span>
            </div>
          </div>

          {/* <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Payment
            </span>
            <p className="font-medium text-foreground">
              {order.paymentStatus ?? "Pending"}
            </p>
          </div> */}

          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Confirmation sent to
            </span>
            <p className="truncate font-medium text-foreground flex items-center gap-1.5">
              <Mail className="size-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{order.contactEmail}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Card 2: Ordered Products Card (with bg-white) */}
      <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-sm sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">
              Ordered products
            </h2>
          </div>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {order.items.reduce((s, i) => s + i.quantity, 0)}{" "}
            {order.items.reduce((s, i) => s + i.quantity, 0) === 1
              ? "item"
              : "items"}
          </span>
        </div>

        <ul className="divide-y divide-border/60">
          {order.items.map((item) => {
            const unit = Number(item.unitPrice);
            const line = Number(item.lineTotal);
            const originalUnit =
              item.originalUnitPrice != null
                ? Number(item.originalUnitPrice)
                : null;
            const hasDiscount =
              originalUnit != null && originalUnit > unit && originalUnit > 0;
            const discountPercent = hasDiscount
              ? Math.round(((originalUnit - unit) / originalUnit) * 100)
              : 0;
            const originalLine = hasDiscount
              ? originalUnit * item.quantity
              : null;

            return (
              <li
                key={item.id}
                className="flex items-start justify-between gap-4 py-4 first:pt-1 last:pb-1"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/30 text-muted-foreground">
                    <Package className="size-6 text-primary/70" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-snug">
                      {item.productName}
                    </p>
                    {item.variantName ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Variant: <span className="font-medium text-foreground/80">{item.variantName}</span>
                      </p>
                    ) : null}
                    <div className="mt-1 flex flex-wrap items-baseline gap-2 text-xs">
                      <span className="font-medium text-foreground">
                        Qty: {item.quantity}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="font-medium text-foreground">
                        {formatInr(unit)} each
                      </span>
                      {hasDiscount ? (
                        <>
                          <span className="text-muted-foreground line-through">
                            {formatInr(originalUnit)}
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
                    {formatInr(line)}
                  </p>
                  {originalLine != null ? (
                    <p className="text-xs text-muted-foreground line-through">
                      {formatInr(originalLine)}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Card 3: Summary Breakdown & Delivery Destination (with bg-white) */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Delivery Destination */}
        <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-sm sm:p-6 space-y-3">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <MapPin className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Delivery address
            </h3>
          </div>
          {shippingAddr ? (
            <div className="space-y-1 text-sm text-foreground/90">
              {shippingAddr.fullName ? (
                <p className="font-semibold text-foreground">
                  {shippingAddr.fullName}
                </p>
              ) : null}
              <p className="text-muted-foreground">{shippingAddr.line1}</p>
              {shippingAddr.line2 ? (
                <p className="text-muted-foreground">{shippingAddr.line2}</p>
              ) : null}
              {shippingAddr.cityStatePin ? (
                <p className="text-muted-foreground">{shippingAddr.cityStatePin}</p>
              ) : null}
              {shippingAddr.phone ? (
                <p className="pt-1 text-xs text-muted-foreground">
                  Phone: <span className="text-foreground">{shippingAddr.phone}</span>
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Confirmation sent to {order.contactEmail}
            </p>
          )}
        </div>

        {/* Financial Breakdown */}
        <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-sm sm:p-6 space-y-2.5 text-sm">
          <h3 className="border-b border-border/60 pb-3 text-sm font-semibold text-foreground">
            Payment summary
          </h3>

          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatInr(Number(order.subtotal))}</span>
          </div>

          {Number(order.discountTotal) > 0 ? (
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>
                Discount savings
                {Number(order.subtotal) > 0
                  ? ` (${Math.round(
                      (Number(order.discountTotal) / Number(order.subtotal)) *
                        100,
                    )}% off)`
                  : ""}
              </span>
              <span>-{formatInr(Number(order.discountTotal))}</span>
            </div>
          ) : null}

          {Number(order.cgstTotal ?? 0) > 0 ? (
            <div className="flex justify-between text-muted-foreground">
              <span>CGST</span>
              <span>{formatInr(Number(order.cgstTotal))}</span>
            </div>
          ) : null}

          {Number(order.sgstTotal ?? 0) > 0 ? (
            <div className="flex justify-between text-muted-foreground">
              <span>SGST</span>
              <span>{formatInr(Number(order.sgstTotal))}</span>
            </div>
          ) : null}

          {Number(order.taxTotal) > 0 &&
          !(Number(order.cgstTotal ?? 0) > 0 || Number(order.sgstTotal ?? 0) > 0) ? (
            <div className="flex justify-between text-muted-foreground">
              <span>Tax</span>
              <span>{formatInr(Number(order.taxTotal))}</span>
            </div>
          ) : null}

          <div className="flex justify-between text-muted-foreground">
            <span>Shipping</span>
            <span className="font-medium text-emerald-700">Free</span>
          </div>

          <div className="flex justify-between border-t border-border/80 pt-2.5 text-base font-bold text-foreground">
            <span>Grand total</span>
            <span>{formatInr(Number(order.grandTotal))}</span>
          </div>
        </div>
      </div>

      {/* Action Navigation Section */}
      {/* Action Navigation Section */}
      {isPaid && isAuthenticated ? (
        <div className="space-y-4 rounded-2xl border border-border/80 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            Your order has been recorded. You can view order progress and invoices anytime in your account.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="shadow-sm">
              <Link href={`/account/orders/${order.orderId}`}>
                View order
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/category" className="inline-flex items-center gap-1.5">
                Continue shopping
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      ) : null}

      {isPaid && !isAuthenticated ? (
        <div className="space-y-4 rounded-2xl border border-border/80 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            We&apos;ve sent your receipt and tracking details to{" "}
            <span className="font-semibold text-foreground">
              {order.contactEmail}
            </span>
            . To manage and track all your orders in one place, sign up or sign in using this email.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="shadow-sm">
              <Link href={`/account/orders/${order.orderId}`}>
                View order
              </Link>
            </Button>
            <Button asChild variant="default" size="lg" className="shadow-sm">
              <Link
                href={`/account/register?email=${encodeURIComponent(order.contactEmail)}&from=guest-order&redirect=${encodeURIComponent(`/account/orders/${order.orderId}`)}`}
              >
                Create account
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link
                href={`/account/login?email=${encodeURIComponent(order.contactEmail)}&from=guest-order&redirect=${encodeURIComponent(`/account/orders/${order.orderId}`)}`}
              >
                Sign in
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/category" className="inline-flex items-center gap-1.5">
                Continue shopping
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      ) : null}

      {!isPaid ? (
        <div className="text-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/checkout">Return to checkout</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function ThankYouPageView() {
  return (
    <Suspense
      fallback={
        <div className="container-page section-space flex justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}

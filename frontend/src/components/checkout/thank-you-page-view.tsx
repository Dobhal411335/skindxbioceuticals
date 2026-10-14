"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { checkoutService } from "@/features/checkout/checkout.service";
import type { OrderConfirmationResult } from "@/features/checkout/checkout.types";
import { useAuth } from "@/hooks/useAuth";
import { formatInr } from "@/lib/utils";

const CONFIRMATION_TOKEN_KEY = "skindx_order_confirmation_token";

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

  return (
    <div className="container-page section-space max-w-2xl">
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
          {isPaid ? (
            <CheckCircle2 className="size-8" aria-hidden />
          ) : (
            <Loader2 className="size-8 animate-spin" aria-hidden />
          )}
        </div>
        <h1 className="text-2xl font-semibold">
          {isPaid ? "Thank you for your order!" : "Payment pending"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isPaid
            ? `Order ${order.orderNumber} is confirmed.`
            : `Order ${order.orderNumber} is awaiting payment confirmation.`}
        </p>
      </div>

      <div className="mt-8 space-y-4 rounded-lg border border-border p-5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status</span>
          <span className="font-medium">{order.status}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Payment</span>
          <span className="font-medium">{order.paymentStatus ?? "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Email</span>
          <span className="font-medium">{order.contactEmail}</span>
        </div>
        <ul className="divide-y divide-border border-t border-border pt-3">
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
              <li key={item.id} className="flex justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p>
                    {item.productName} ({item.variantName}) × {item.quantity}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatInr(unit)} each
                    {hasDiscount ? (
                      <span className="ml-2 line-through">
                        {formatInr(originalUnit)}
                      </span>
                    ) : null}
                  </p>
                  {hasDiscount ? (
                    <p className="mt-0.5 text-[11px] font-medium text-green-700">
                      {discountPercent}% off
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatInr(line)}</p>
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
        <div className="space-y-1 border-t border-border pt-3">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatInr(Number(order.subtotal))}</span>
          </div>
          {Number(order.discountTotal) > 0 ? (
            <div className="flex justify-between text-muted-foreground">
              <span>
                Discount
                {Number(order.subtotal) > 0
                  ? ` (${Math.round(
                      (Number(order.discountTotal) / Number(order.subtotal)) *
                        100,
                    )}%)`
                  : ""}
              </span>
              <span>-{formatInr(Number(order.discountTotal))}</span>
            </div>
          ) : null}
          {Number(order.taxTotal) > 0 ? (
            <div className="flex justify-between text-muted-foreground">
              <span>Tax</span>
              <span>{formatInr(Number(order.taxTotal))}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatInr(Number(order.grandTotal))}</span>
          </div>
        </div>
      </div>

      {isPaid && isAuthenticated && !order.isGuest ? (
        <div className="mt-8 space-y-3 text-center">
          <p className="text-sm text-muted-foreground">
            Your order has been placed successfully. You can view your order
            status and updates in your account.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href={`/account/orders/${order.orderId}`}>View order</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/category">Continue shopping</Link>
            </Button>
          </div>
        </div>
      ) : null}

      {isPaid && order.isGuest ? (
        <div className="mt-8 space-y-3 text-center">
          <p className="text-sm text-muted-foreground">
            Thank you for your order! We&apos;ve sent your order confirmation to
            your verified email address. To track your order and see future
            updates, sign in or create an account using the same email address
            you used at checkout. Your eligible guest orders will appear
            automatically after your email is verified.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/account/login">Sign in or create an account</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/category">Continue shopping</Link>
            </Button>
          </div>
        </div>
      ) : null}

      {!isPaid ? (
        <div className="mt-8 text-center">
          <Button asChild variant="outline">
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

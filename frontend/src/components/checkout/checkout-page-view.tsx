"use client";

import Image from "next/image";
import Link from "next/link";
import { CircleAlert, HelpCircle, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useCartTotals } from "@/hooks/useCartTotals";
import { formatPaiseToInr } from "@/lib/utils";
import {
  applyCoupon,
  DEMO_COUPON,
  setCouponCode,
} from "@/store/slices/cartSlice";

export function CheckoutPageView() {
  const dispatch = useAppDispatch();
  const {
    items,
    extras,
    subtotalInPaise,
    discountInPaise,
    giftWrapInPaise,
    totalInPaise,
  } = useCartTotals();

  if (items.length === 0) {
    return (
      <div className="container-page section-space text-center">
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <p className="mt-3 text-muted-foreground">Your cart is empty.</p>
        <Button asChild className="mt-6">
          <Link href="/category">Browse products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid min-h-[70vh] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="container-page max-w-2xl py-10 lg:ml-auto lg:mr-0 lg:px-10">
        <Link href="/" className="font-display text-2xl font-semibold">
          SkinDx
        </Link>

        <form className="mt-10 space-y-10" onSubmit={(event) => event.preventDefault()}>
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Contact</h2>
              <Link href="/account/login" className="text-sm text-primary hover:underline">
                Sign in
              </Link>
            </div>
            <div className="relative">
              <Label htmlFor="checkout-email" className="sr-only">
                Email or mobile phone number
              </Label>
              <Input
                id="checkout-email"
                type="email"
                placeholder="Email or mobile phone number"
                autoComplete="email"
              />
              <HelpCircle
                className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
            </div>
            <div className="flex items-start gap-2">
              <Checkbox id="checkout-news" />
              <Label htmlFor="checkout-news" className="text-sm font-normal">
                Email me with news and offers
              </Label>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Delivery</h2>
            <Select defaultValue="IN">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Country/Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN">India</SelectItem>
              </SelectContent>
            </Select>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="First name (optional)" autoComplete="given-name" />
              <Input placeholder="Last name" autoComplete="family-name" required />
            </div>
            <Input placeholder="Address" autoComplete="street-address" required />
            <Input
              placeholder="Apartment, suite, etc. (optional)"
              autoComplete="address-line2"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="City" autoComplete="address-level2" required />
              <Input
                placeholder="PIN code"
                autoComplete="postal-code"
                inputMode="numeric"
                required
              />
            </div>
            <div className="flex items-start gap-2">
              <Checkbox id="checkout-save" />
              <Label htmlFor="checkout-save" className="text-sm font-normal">
                Save this information for next time
              </Label>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Shipping method</h2>
            <div className="flex items-center justify-between rounded-lg border-2 border-primary bg-primary/5 px-4 py-3 text-sm">
              <span>Standard shipping (India)</span>
              <span className="font-medium">Calculated next</span>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Payment</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                All transactions are secure and encrypted.
              </p>
            </div>
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-muted/40 px-6 py-10 text-center">
              <CircleAlert className="size-8 text-muted-foreground" aria-hidden />
              <p className="max-w-sm text-sm text-muted-foreground">
                Razorpay checkout is not connected on this static page. Payments
                will be verified server-side when the integration is enabled.
              </p>
            </div>
            <Button type="button" className="w-full" size="lg" disabled>
              Pay now
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              <Link href="/cart" className="underline-offset-4 hover:underline">
                Return to cart
              </Link>
            </p>
          </section>
        </form>
      </div>

      <aside className="border-t border-border bg-surface lg:border-t-0 lg:border-l">
        <div className="container-page max-w-md py-10 lg:ml-0 lg:px-10">
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <div className="relative size-16 shrink-0">
                  <div className="relative size-16 overflow-hidden rounded-md border border-border bg-background">
                    <Image
                      src={item.image}
                      alt={item.alt}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
                    {item.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  {item.variantLabel ? (
                    <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
                  ) : null}
                </div>
                <p className="text-sm font-medium">
                  {formatPaiseToInr(item.unitPriceInPaise * item.quantity)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex gap-2">
            <Input
              value={extras.couponCode}
              onChange={(event) => dispatch(setCouponCode(event.target.value))}
              placeholder="Discount code"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const code = extras.couponCode.trim().toUpperCase();
                dispatch(applyCoupon(code === DEMO_COUPON ? DEMO_COUPON : null));
              }}
            >
              Apply
            </Button>
          </div>

          <div className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPaiseToInr(subtotalInPaise)}</span>
            </div>
            {discountInPaise > 0 && extras.appliedCoupon ? (
              <div className="flex justify-between text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Tag className="size-3.5" aria-hidden />
                  {extras.appliedCoupon}
                </span>
                <span>-{formatPaiseToInr(discountInPaise)}</span>
              </div>
            ) : null}
            {giftWrapInPaise > 0 ? (
              <div className="flex justify-between text-muted-foreground">
                <span>Gift wrap</span>
                <span>{formatPaiseToInr(giftWrapInPaise)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span>Enter shipping address</span>
            </div>
            <div className="flex justify-between pt-2 text-base font-semibold">
              <span>Total</span>
              <span>INR {formatPaiseToInr(totalInPaise)}</span>
            </div>
            {discountInPaise > 0 ? (
              <p className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                <Tag className="size-3.5" aria-hidden />
                Total savings {formatPaiseToInr(discountInPaise)}
              </p>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, X } from "lucide-react";

import { CartLinePrice } from "@/components/cart/cart-line-price";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useCartActions } from "@/hooks/useCartActions";
import { useCartTotals } from "@/hooks/useCartTotals";
import { formatPaiseToInr } from "@/lib/utils";
import { setCartNotes, setTermsAccepted } from "@/store/slices/cartSlice";

export function CartPageView() {
  const dispatch = useAppDispatch();
  const { setQuantity, remove } = useCartActions();
  const {
    items,
    extras,
    originalSubtotalInPaise,
    discountInPaise,
    discountPercent,
    totalInPaise,
  } = useCartTotals();

  return (
    <div className="container-page section-space">
      <nav className="mb-4 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Your cart</span>
      </nav>

      <h1 className="text-3xl font-semibold tracking-wide uppercase">Your cart</h1>

      {items.length === 0 ? (
        <div className="mt-10 rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Button asChild className="mt-4">
            <Link href="/category">Continue shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-6">
            <div className="hidden grid-cols-[1fr_6rem_8rem_6rem_2rem] gap-4 border-b border-border pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase md:grid">
              <span>Product</span>
              <span>Price</span>
              <span>Quantity</span>
              <span>Total</span>
              <span className="sr-only">Remove</span>
            </div>

            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="grid gap-4 py-5 md:grid-cols-[1fr_6rem_8rem_6rem_2rem] md:items-center"
                >
                  <div className="flex gap-3">
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-surface">
                      <Image
                        src={item.image}
                        alt={item.alt}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                    <div>
                      <Link
                        href={`/products/${item.slug}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {item.name}
                      </Link>
                      {item.variantLabel ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.variantLabel}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <CartLinePrice item={item} mode="unit" />
                  <QuantityStepper
                    size="sm"
                    value={item.quantity}
                    onChange={(quantity) => void setQuantity(item.id, quantity)}
                  />
                  <CartLinePrice item={item} mode="line" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => void remove(item.id)}
                  >
                    <X className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>

            <div>
              <Label htmlFor="cart-notes" className="mb-2 block">
                Special instruction for seller
              </Label>
              <Textarea
                id="cart-notes"
                value={extras.notes}
                onChange={(event) => dispatch(setCartNotes(event.target.value))}
                placeholder="Special instruction for seller…"
                rows={4}
              />
            </div>

            <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="size-4" aria-hidden />
              Secure shopping guarantee
            </p>
          </div>

          <aside className="h-fit rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold tracking-wide uppercase">
              Order summary
            </h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{formatPaiseToInr(originalSubtotalInPaise)}</span>
              </div>
              {discountInPaise > 0 ? (
                <div className="flex justify-between text-muted-foreground">
                  <span>Discount ({discountPercent}%)</span>
                  <span>-{formatPaiseToInr(discountInPaise)}</span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-border pt-4 text-base font-semibold">
                <span>Total</span>
                <span>{formatPaiseToInr(totalInPaise)}</span>
              </div>
            </div>

            {/* Coupon UI commented out for now
            <div className="mt-5 space-y-2">
              <Label htmlFor="cart-coupon">Coupon code</Label>
              ...
            </div>
            */}

            <div className="mt-4 flex items-start gap-2">
              <Checkbox
                id="cart-page-terms"
                checked={extras.termsAccepted}
                onCheckedChange={(checked) =>
                  dispatch(setTermsAccepted(checked === true))
                }
              />
              <Label
                htmlFor="cart-page-terms"
                className="text-xs leading-snug font-normal"
              >
                I agree with Terms &amp; Conditions
              </Label>
            </div>

            {extras.termsAccepted ? (
              <Button asChild className="mt-4 w-full" size="lg">
                <Link href="/checkout">Proceed to checkout</Link>
              </Button>
            ) : (
              <Button type="button" className="mt-4 w-full" size="lg" disabled>
                Proceed to checkout
              </Button>
            )}
            <Button asChild variant="outline" className="mt-2 w-full" size="lg">
              <Link href="/category">Continue shopping</Link>
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}

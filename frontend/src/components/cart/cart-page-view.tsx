"use client";

import Image from "next/image";
import Link from "next/link";
import { Gift, ShieldCheck, X } from "lucide-react";

import { QuantityStepper } from "@/components/cart/quantity-stepper";
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
import { Textarea } from "@/components/ui/textarea";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useCartTotals } from "@/hooks/useCartTotals";
import { formatPaiseToInr } from "@/lib/utils";
import {
  applyCoupon,
  DEMO_COUPON,
  GIFT_WRAP_PAISE,
  removeCartItem,
  setCartNotes,
  setCouponCode,
  setGiftWrap,
  setTermsAccepted,
  updateCartItemQuantity,
} from "@/store/slices/cartSlice";

export function CartPageView() {
  const dispatch = useAppDispatch();
  const {
    items,
    extras,
    subtotalInPaise,
    discountInPaise,
    giftWrapInPaise,
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
                  <p className="text-sm">{formatPaiseToInr(item.unitPriceInPaise)}</p>
                  <QuantityStepper
                    size="sm"
                    value={item.quantity}
                    onChange={(quantity) =>
                      dispatch(updateCartItemQuantity({ id: item.id, quantity }))
                    }
                  />
                  <p className="text-sm font-semibold">
                    {formatPaiseToInr(item.unitPriceInPaise * item.quantity)}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => dispatch(removeCartItem(item.id))}
                  >
                    <X className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <Gift className="size-5 text-muted-foreground" aria-hidden />
                <div>
                  <p className="text-sm font-semibold">Do you want a gift wrap?</p>
                  <p className="text-xs text-muted-foreground">
                    Only for {formatPaiseToInr(GIFT_WRAP_PAISE)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant={extras.giftWrap ? "secondary" : "outline"}
                onClick={() => dispatch(setGiftWrap(!extras.giftWrap))}
              >
                {extras.giftWrap ? "Added" : "Add"}
              </Button>
            </div>

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
            <div className="mt-4 flex items-center justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatPaiseToInr(subtotalInPaise)}</span>
            </div>

            <div className="mt-5 space-y-2">
              <p className="text-sm font-medium">Estimate shipping</p>
              <Select defaultValue="IN">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">India</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="MH">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MH">Maharashtra</SelectItem>
                  <SelectItem value="KA">Karnataka</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="PIN code" inputMode="numeric" />
              <Button type="button" className="w-full">
                Calculate shipping
              </Button>
            </div>

            <div className="mt-5 space-y-2">
              <Label htmlFor="cart-coupon">Coupon code</Label>
              <Input
                id="cart-coupon"
                value={extras.couponCode}
                onChange={(event) => dispatch(setCouponCode(event.target.value))}
                placeholder="Enter coupon code"
              />
              <p className="text-xs text-muted-foreground">
                Coupon code will be applied on the checkout page. Demo: {DEMO_COUPON}
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  const code = extras.couponCode.trim().toUpperCase();
                  dispatch(applyCoupon(code === DEMO_COUPON ? DEMO_COUPON : null));
                }}
              >
                Apply coupon
              </Button>
            </div>

            <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
              {discountInPaise > 0 && extras.appliedCoupon ? (
                <div className="flex justify-between text-muted-foreground">
                  <span>Discount ({extras.appliedCoupon})</span>
                  <span>-{formatPaiseToInr(discountInPaise)}</span>
                </div>
              ) : null}
              {giftWrapInPaise > 0 ? (
                <div className="flex justify-between text-muted-foreground">
                  <span>Gift wrap</span>
                  <span>{formatPaiseToInr(giftWrapInPaise)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatPaiseToInr(totalInPaise)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Tax included and shipping calculated at checkout
              </p>
            </div>

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

"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ClipboardList,
  // Tag, // Coupon UI commented out for now
  X,
} from "lucide-react";

import { CartLinePrice } from "@/components/cart/cart-line-price";
import { useCartUi } from "@/components/cart/cart-ui-context";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useCartActions } from "@/hooks/useCartActions";
import { useCartTotals } from "@/hooks/useCartTotals";
import { formatPaiseToInr, cn } from "@/lib/utils";
import {
  // applyCoupon,
  // DEMO_COUPON,
  setCartNotes,
  // setCouponCode,
  setTermsAccepted,
} from "@/store/slices/cartSlice";

type CartOption = "notes" | null;
// type CartOption = "notes" | "coupon" | null; // coupon commented out

export function CartDrawer() {
  const { isOpen, closeCart } = useCartUi();
  const dispatch = useAppDispatch();
  const { setQuantity, remove } = useCartActions();
  const {
    items,
    extras,
    itemCount,
    originalSubtotalInPaise,
    discountInPaise,
    discountPercent,
    totalInPaise,
  } = useCartTotals();
  const [activeOption, setActiveOption] = useState<CartOption>(null);
  const [notesDraft, setNotesDraft] = useState(extras.notes);
  // const [couponDraft, setCouponDraft] = useState(extras.couponCode);

  function toggleOption(option: Exclude<CartOption, null>) {
    setActiveOption((current) => (current === option ? null : option));
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (!open ? closeCart() : undefined)}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-4 py-4">
          <div className="flex items-center justify-between gap-3 pr-8">
            <SheetTitle className="text-left text-lg font-semibold">
              Shopping Cart
            </SheetTitle>
            <p className="text-sm text-muted-foreground">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </p>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          ) : (
            <ul className="space-y-5">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-surface">
                    <Image
                      src={item.image || "https://placehold.co/600x400/png"}
                      alt={item.alt || "Product image"}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={closeCart}
                          className="line-clamp-2 text-sm font-medium hover:underline"
                        >
                          {item.name}
                        </Link>
                        {item.variantLabel ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.variantLabel}
                          </p>
                        ) : null}
                        <div className="mt-1">
                          <CartLinePrice item={item} mode="unit" compact />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => void remove(item.id)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                    <div className="mt-3">
                      <QuantityStepper
                        size="sm"
                        value={item.quantity}
                        onChange={(quantity) =>
                          void setQuantity(item.id, quantity)
                        }
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 grid grid-cols-1 gap-2 border-y border-border py-3">
            <button
              type="button"
              className={cn(
                "flex flex-col items-center gap-1 rounded-md px-1 py-2 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                activeOption === "notes" && "bg-muted text-foreground",
              )}
              onClick={() => toggleOption("notes")}
            >
              <ClipboardList className="size-4" aria-hidden />
              Notes
            </button>
            {/* Coupon option commented out for now
            <button
              type="button"
              className={cn(
                "flex flex-col items-center gap-1 rounded-md px-1 py-2 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground",
                activeOption === "coupon" && "bg-muted text-foreground",
              )}
              onClick={() => toggleOption("coupon")}
            >
              <Tag className="size-4" aria-hidden />
              Coupon
            </button>
            */}
          </div>

          {activeOption === "notes" ? (
            <div className="mt-4 space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ClipboardList className="size-4" aria-hidden />
                Order special instructions
              </div>
              <Textarea
                value={notesDraft}
                onChange={(event) => setNotesDraft(event.target.value)}
                placeholder="Add a note for fulfilment…"
                rows={4}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => {
                    dispatch(setCartNotes(notesDraft));
                    setActiveOption(null);
                  }}
                >
                  Save
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setActiveOption(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}

          {/* Coupon panel commented out for now
          {activeOption === "coupon" ? (
            <div className="mt-4 space-y-3 rounded-lg border border-border p-4">
              ...
            </div>
          ) : null}
          */}
        </div>

        <div className="mt-auto space-y-3 border-t border-border px-4 py-4">
          <div className="flex items-center justify-between text-sm">
            <span>Subtotal</span>
            <span className="font-medium">
              {formatPaiseToInr(originalSubtotalInPaise)}
            </span>
          </div>
          {discountInPaise > 0 ? (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Discount ({discountPercent}%)</span>
              <span>-{formatPaiseToInr(discountInPaise)}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatPaiseToInr(totalInPaise)}</span>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="cart-terms"
              checked={extras.termsAccepted}
              onCheckedChange={(checked) =>
                dispatch(setTermsAccepted(checked === true))
              }
            />
            <Label htmlFor="cart-terms" className="text-xs leading-snug font-normal">
              I agree with Terms &amp; Conditions
            </Label>
          </div>

          {extras.termsAccepted && items.length > 0 ? (
            <Button asChild className="w-full" size="lg">
              <Link href="/checkout" onClick={closeCart}>
                Checkout
              </Link>
            </Button>
          ) : (
            <Button type="button" className="w-full" size="lg" disabled>
              Checkout
            </Button>
          )}
          <Button asChild variant="outline" className="w-full" size="lg">
            <Link href="/cart" onClick={closeCart}>
              View cart
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

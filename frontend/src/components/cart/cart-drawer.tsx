"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ClipboardList,
  Gift,
  Tag,
  Truck,
  X,
} from "lucide-react";

import { useCartUi } from "@/components/cart/cart-ui-context";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useCartTotals } from "@/hooks/useCartTotals";
import { formatPaiseToInr, cn } from "@/lib/utils";
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

type CartOption = "notes" | "gift" | "shipping" | "coupon" | null;

export function CartDrawer() {
  const { isOpen, closeCart } = useCartUi();
  const dispatch = useAppDispatch();
  const {
    items,
    extras,
    itemCount,
    subtotalInPaise,
    discountInPaise,
    totalInPaise,
    amountToFreeShippingInPaise,
  } = useCartTotals();
  const [activeOption, setActiveOption] = useState<CartOption>(null);
  const [notesDraft, setNotesDraft] = useState(extras.notes);
  const [couponDraft, setCouponDraft] = useState(extras.couponCode);

  const progress =
    amountToFreeShippingInPaise <= 0
      ? 100
      : Math.min(
          99,
          Math.round(
            ((99900 - amountToFreeShippingInPaise) / 99900) * 100,
          ),
        );

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

        <div className="border-b border-border px-4 py-4">
          <div className="mb-2 flex items-center gap-2 text-sm">
            <Truck className="size-4 text-primary" aria-hidden />
            {amountToFreeShippingInPaise > 0 ? (
              <p>
                Only{" "}
                <span className="font-semibold">
                  {formatPaiseToInr(amountToFreeShippingInPaise)}
                </span>{" "}
                away from free shipping
              </p>
            ) : (
              <p className="font-medium">You have unlocked free shipping</p>
            )}
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

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
                        <p className="mt-1 text-sm font-semibold">
                          {formatPaiseToInr(item.unitPriceInPaise)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => dispatch(removeCartItem(item.id))}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                    <div className="mt-3">
                      <QuantityStepper
                        size="sm"
                        value={item.quantity}
                        onChange={(quantity) =>
                          dispatch(
                            updateCartItemQuantity({ id: item.id, quantity }),
                          )
                        }
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 grid grid-cols-4 gap-2 border-y border-border py-3">
            {(
              [
                { id: "notes", icon: ClipboardList, label: "Notes" },
                { id: "gift", icon: Gift, label: "Gift wrap" },
                { id: "shipping", icon: Truck, label: "Shipping" },
                { id: "coupon", icon: Tag, label: "Coupon" },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                className={cn(
                  "flex flex-col items-center gap-1 rounded-md px-1 py-2 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  activeOption === option.id && "bg-muted text-foreground",
                )}
                onClick={() => toggleOption(option.id)}
              >
                <option.icon className="size-4" aria-hidden />
                {option.label}
              </button>
            ))}
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

          {activeOption === "gift" ? (
            <div className="mt-4 space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Gift className="size-4" aria-hidden />
                Gift wrapping
              </div>
              <p className="text-sm text-muted-foreground">
                Add gift wrap for {formatPaiseToInr(GIFT_WRAP_PAISE)}?
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => {
                    dispatch(setGiftWrap(true));
                    setActiveOption(null);
                  }}
                >
                  Add a gift wrap
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    dispatch(setGiftWrap(false));
                    setActiveOption(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}

          {activeOption === "shipping" ? (
            <div className="mt-4 space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Truck className="size-4" aria-hidden />
                Estimate shipping rates
              </div>
              <div className="space-y-2">
                <Select defaultValue="IN">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Country/Region" />
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
                    <SelectItem value="DL">Delhi</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="PIN code" inputMode="numeric" />
              </div>
              <div className="flex gap-2">
                <Button type="button" className="flex-1">
                  Calculate shipping
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
              <p className="text-xs text-muted-foreground">
                UI estimate only — live rates require fulfilment wiring.
              </p>
            </div>
          ) : null}

          {activeOption === "coupon" ? (
            <div className="mt-4 space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Tag className="size-4" aria-hidden />
                Add a coupon
              </div>
              <Input
                value={couponDraft}
                onChange={(event) => setCouponDraft(event.target.value)}
                placeholder="Coupon code"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => {
                    const code = couponDraft.trim().toUpperCase();
                    dispatch(setCouponCode(code));
                    dispatch(
                      applyCoupon(code === DEMO_COUPON ? DEMO_COUPON : null),
                    );
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
              <p className="text-xs text-muted-foreground">
                Demo code: {DEMO_COUPON}
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-auto space-y-3 border-t border-border px-4 py-4">
          <div className="flex items-center justify-between text-sm">
            <span>Subtotal</span>
            <span className="font-medium">{formatPaiseToInr(subtotalInPaise)}</span>
          </div>
          {discountInPaise > 0 && extras.appliedCoupon ? (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Discount ({extras.appliedCoupon})</span>
              <span>-{formatPaiseToInr(discountInPaise)}</span>
            </div>
          ) : null}
          {extras.giftWrap ? (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Gift wrap</span>
              <span>{formatPaiseToInr(GIFT_WRAP_PAISE)}</span>
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

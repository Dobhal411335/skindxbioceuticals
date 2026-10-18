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
import { CartOrderSummaryRows } from "@/components/cart/cart-order-summary-rows";
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
import { useAppSelector } from "@/hooks/useAppSelector";
import { useAuth } from "@/hooks/useAuth";
import { useIsVendor } from "@/hooks/useIsVendor";
import { useCartActions } from "@/hooks/useCartActions";
import { useCartTotals } from "@/hooks/useCartTotals";
import { setTermsAccepted } from "@/store/slices/cartSlice";

export function CartDrawer() {
  const { isOpen, closeCart } = useCartUi();
  const dispatch = useAppDispatch();
  const { isLoading: authLoading } = useAuth();
  const isVendor = useIsVendor();
  const { setQuantity, setItemNote, remove } = useCartActions();
  const hydrated = useAppSelector((state) => state.cart.hydrated);
  const cartStatus = useAppSelector((state) => state.cart.status);
  const {
    items,
    extras,
    itemCount,
    originalSubtotalInPaise,
    subtotalInPaise,
    discountInPaise,
    discountPercent,
    cgstInPaise,
    sgstInPaise,
    cgstPercent,
    sgstPercent,
    totalInPaise,
  } = useCartTotals();
  const [editingNoteItemId, setEditingNoteItemId] = useState<string | null>(null);
  const [itemNoteDraft, setItemNoteDraft] = useState("");

  const cartLoading =
    items.length === 0 &&
    (authLoading ||
      !hydrated ||
      cartStatus === "syncing" ||
      cartStatus === "loading");

  function startEditItemNote(itemId: string, currentNote?: string) {
    setEditingNoteItemId(itemId);
    setItemNoteDraft(currentNote || "");
  }

  function saveItemNote(itemId: string) {
    setItemNote(itemId, itemNoteDraft);
    setEditingNoteItemId(null);
    setItemNoteDraft("");
  }

  function cancelItemNote() {
    setEditingNoteItemId(null);
    setItemNoteDraft("");
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
          {cartLoading ? (
            <p className="text-sm text-muted-foreground">Loading cart…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-border/60 bg-card p-3 shadow-2xs"
                >
                  <div className="flex gap-3">
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
                            <CartLinePrice item={item} mode="unit" compact hideDiscount={isVendor} />
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
                  </div>

                  {/* Per-product note display and inline editor */}
                  {editingNoteItemId === item.id ? (
                    <div className="mt-3 space-y-2 rounded-md border border-border bg-muted/30 p-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                        <ClipboardList className="size-3.5 text-muted-foreground" />
                        <span>Item note</span>
                      </div>
                      <Textarea
                        value={itemNoteDraft}
                        onChange={(event) => setItemNoteDraft(event.target.value)}
                        placeholder="Add special instructions for this item…"
                        rows={2}
                        className="text-xs resize-none bg-background"
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={cancelItemNote}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="xs"
                          onClick={() => saveItemNote(item.id)}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : item.note ? (
                    <div className="mt-2.5 flex items-start justify-between gap-2 rounded-md border border-border/50 bg-muted/40 px-2.5 py-1.5 text-xs">
                      <div className="flex items-start gap-1.5 min-w-0 flex-1">
                        <ClipboardList className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                        <p className="text-foreground/90 leading-snug break-words">
                          <span className="font-medium text-muted-foreground">Note: </span>
                          {item.note}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-[11px]">
                        <button
                          type="button"
                          onClick={() => startEditItemNote(item.id, item.note)}
                          className="text-muted-foreground hover:text-foreground underline underline-offset-2"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setItemNote(item.id, "")}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 pt-1.5 border-t border-border/40">
                      <button
                        type="button"
                        onClick={() => startEditItemNote(item.id)}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ClipboardList className="size-3.5" />
                        <span>+ Add note</span>
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-auto space-y-3 border-t border-border px-4 py-4">
          <CartOrderSummaryRows
            className="space-y-2 text-sm"
            originalSubtotalInPaise={originalSubtotalInPaise}
            subtotalInPaise={subtotalInPaise}
            discountInPaise={discountInPaise}
            discountPercent={discountPercent}
            hideDiscount={isVendor}
            cgstInPaise={cgstInPaise}
            sgstInPaise={sgstInPaise}
            cgstPercent={cgstPercent}
            sgstPercent={sgstPercent}
            totalInPaise={totalInPaise}
          />

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

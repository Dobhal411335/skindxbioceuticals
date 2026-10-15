"use client";

import Image from "next/image";
import Link from "next/link";
import { ClipboardList, ShieldCheck, ShoppingCart, X } from "lucide-react";

import { CartLinePrice, getCartLinePricing } from "@/components/cart/cart-line-price";
import { CartOrderSummaryRows } from "@/components/cart/cart-order-summary-rows";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cartLineTaxInPaise } from "@/features/cart/cart-tax";
import { useAuth } from "@/hooks/useAuth";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useCartActions } from "@/hooks/useCartActions";
import { useCartTaxEnrichment } from "@/hooks/useCartTaxEnrichment";
import { useCartTotals } from "@/hooks/useCartTotals";
import { formatPaiseToInr } from "@/lib/utils";
import {
  setCartNotes,
  setTermsAccepted,
} from "@/store/slices/cartSlice";

export function CartPageView() {
  const dispatch = useAppDispatch();
  const { isLoading: authLoading } = useAuth();
  const { setQuantity, remove } = useCartActions();
  const hydrated = useAppSelector((state) => state.cart.hydrated);
  const status = useAppSelector((state) => state.cart.status);
  const {
    items,
    extras,
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

  // Prefer local paint: only block empty-state while hydrate/sync is still pending.
  const loading =
    items.length === 0 &&
    (authLoading ||
      !hydrated ||
      status === "syncing" ||
      status === "loading");

  useCartTaxEnrichment(items, { enabled: !loading && items.length > 0 });

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

      {loading ? (
        <div className="mt-10 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-10 rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Button asChild className="mt-4 rounded-full py-5">
            <Link href="/category">Continue shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-6">
            <div className="hidden gap-4 border-b border-border pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase xl:grid xl:grid-cols-[minmax(0,1.6fr)_7rem_5.5rem_5.5rem_7.5rem_7rem_2rem]">
              <span>Product</span>
              <span>Price</span>
              <span>CGST</span>
              <span>SGST</span>
              <span>Quantity</span>
              <span>Total</span>
              <span className="sr-only">Remove</span>
            </div>

            <ul className="space-y-4">
              {items.map((item) => {
                const tax = cartLineTaxInPaise(item);
                const pricing = getCartLinePricing(item);
                const cgstPercentLine = item.cgstPercent ?? 0;
                const sgstPercentLine = item.sgstPercent ?? 0;

                return (
                  <li
                    key={item.id}
                    className="rounded-xl border border-border bg-card p-4 shadow-none"
                  >
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_7rem_5.5rem_5.5rem_7.5rem_7rem_2rem] xl:items-center">
                      <div className="flex gap-3 min-w-0">
                        <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-surface border border-border">
                          <Image
                            src={
                              item.image ||
                              "https://placehold.co/160x160/png?text=SkinDx"
                            }
                            alt={item.alt}
                            fill
                            className="object-contain"
                            sizes="80px"
                          />
                        </div>
                        <div className="min-w-0 space-y-1">
                          {item.categoryName ? (
                            <p className="text-[11px] font-semibold tracking-[0.08em] text-primary uppercase">
                              {item.categoryName}
                            </p>
                          ) : null}
                          <Link
                            href={`/products/${item.slug}`}
                            className="block text-sm font-semibold leading-snug hover:text-primary hover:underline"
                          >
                            {item.name}
                          </Link>
                          {item.productCode ? (
                            <p className="text-xs text-muted-foreground">
                              Code:{" "}
                              <span className="font-medium text-foreground">
                                {item.productCode}
                              </span>
                            </p>
                          ) : null}
                          {item.variantLabel ? (
                            <p className="text-xs text-muted-foreground">
                              {item.variantLabel}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div>
                        <p className="mb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase xl:hidden">
                          Price
                        </p>
                        <CartLinePrice item={item} mode="unit" />
                        {/* Mobile: tax under price so CGST/SGST are not only in the summary */}
                        {(tax.cgstInPaise > 0 || tax.sgstInPaise > 0) ? (
                          <div className="mt-1.5 space-y-0.5 text-[11px] text-muted-foreground xl:hidden">
                            {tax.cgstInPaise > 0 ? (
                              <p>
                                CGST {cgstPercentLine}% ·{" "}
                                {formatPaiseToInr(tax.cgstInPaise)}
                              </p>
                            ) : null}
                            {tax.sgstInPaise > 0 ? (
                              <p>
                                SGST {sgstPercentLine}% ·{" "}
                                {formatPaiseToInr(tax.sgstInPaise)}
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>

                      <div className="hidden xl:block">
                        <p className="text-sm font-medium tabular-nums">
                          {formatPaiseToInr(tax.cgstInPaise)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {cgstPercentLine}%
                        </p>
                      </div>

                      <div className="hidden xl:block">
                        <p className="text-sm font-medium tabular-nums">
                          {formatPaiseToInr(tax.sgstInPaise)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {sgstPercentLine}%
                        </p>
                      </div>

                      <div>
                        <p className="mb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase xl:hidden">
                          Quantity
                        </p>
                        <QuantityStepper
                          size="sm"
                          value={item.quantity}
                          onChange={(quantity) =>
                            void setQuantity(item.id, quantity)
                          }
                        />
                      </div>

                      <div>
                        <p className="mb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase xl:hidden">
                          Total
                        </p>
                        <CartLinePrice item={item} mode="line" />
                        {tax.taxInPaise > 0 ? (
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            + tax {formatPaiseToInr(tax.taxInPaise)}
                          </p>
                        ) : null}
                        {pricing.hasDiscount ? (
                          <p className="sr-only">
                            Line savings on {item.name}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex justify-end xl:justify-center">
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
                    </div>

                    {item.note?.trim() ? (
                      <div className="mt-3 flex items-start gap-1.5 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs">
                        <ClipboardList className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                        <p className="text-foreground/90 leading-snug break-words">
                          <span className="font-medium text-muted-foreground">
                            Note:{" "}
                          </span>
                          {item.note}
                        </p>
                      </div>
                    ) : null}
                  </li>
                );
              })}
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

          <aside className="h-fit rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold tracking-wide uppercase">
              Order summary
            </h2>
            <CartOrderSummaryRows
              className="mt-4 space-y-2.5 text-sm"
              originalSubtotalInPaise={originalSubtotalInPaise}
              subtotalInPaise={subtotalInPaise}
              discountInPaise={discountInPaise}
              discountPercent={discountPercent}
              cgstInPaise={cgstInPaise}
              sgstInPaise={sgstInPaise}
              cgstPercent={cgstPercent}
              sgstPercent={sgstPercent}
              totalInPaise={totalInPaise}
            />

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
              <Button asChild className="mt-4 w-full rounded-full py-5" size="lg">
                <Link href="/checkout"><ShoppingCart className="size-4 mr-2" /> Proceed to checkout</Link>
              </Button>
            ) : (
              <Button
                type="button"
                className="mt-4 w-full rounded-full py-5"
                size="lg"
                disabled
              >
                <ShoppingCart className="size-4 mr-2" />
                Proceed to checkout
              </Button>
            )}
            <Button
              asChild
              variant="outline"
              className="mt-2 w-full rounded-full border border-gray-500 py-5"
              size="lg"
            >
              <Link href="/category">Continue shopping</Link>
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}

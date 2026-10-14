"use client";

import { useMemo } from "react";

import {
  selectCartCgstTotal,
  selectCartSgstTotal,
  selectCartTaxDisplayPercent,
  selectCartTaxTotal,
} from "@/features/cart/cart-tax";
import { useAppSelector } from "@/hooks/useAppSelector";
import {
  selectCartOriginalSubtotal,
  selectCartProductDiscount,
  selectCartDiscountPercent,
  selectCartSubtotal,
} from "@/store/slices/cartSlice";

export function useCartTotals() {
  const items = useAppSelector((state) => state.cart.items);
  const extras = useAppSelector((state) => state.cart.extras);

  return useMemo(() => {
    const originalSubtotalInPaise = selectCartOriginalSubtotal(items);
    const subtotalInPaise = selectCartSubtotal(items);
    const discountInPaise = selectCartProductDiscount(items);
    const discountPercent = selectCartDiscountPercent(items);
    const cgstInPaise = selectCartCgstTotal(items);
    const sgstInPaise = selectCartSgstTotal(items);
    const taxInPaise = selectCartTaxTotal(items);
    const cgstPercent = selectCartTaxDisplayPercent(items, "cgst");
    const sgstPercent = selectCartTaxDisplayPercent(items, "sgst");
    const giftWrapInPaise = 0;
    const shippingInPaise = 0;
    // Payable after discount + CGST/SGST (from original list totals).
    const totalInPaise = subtotalInPaise + taxInPaise;
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items,
      extras,
      itemCount,
      /** Original / list-price subtotal (before product discounts). */
      originalSubtotalInPaise,
      /** Payable subtotal after product discounts (before tax). */
      subtotalInPaise,
      discountInPaise,
      discountPercent,
      cgstInPaise,
      sgstInPaise,
      cgstPercent,
      sgstPercent,
      taxInPaise,
      giftWrapInPaise,
      shippingInPaise,
      /** Grand total: payable + CGST + SGST. */
      totalInPaise,
      amountToFreeShippingInPaise: 0,
    };
  }, [items, extras]);
}

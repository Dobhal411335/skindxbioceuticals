"use client";

import { useMemo } from "react";

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
    const giftWrapInPaise = 0;
    const shippingInPaise = 0;
    const totalInPaise = subtotalInPaise;
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items,
      extras,
      itemCount,
      /** Original / list-price subtotal (before product discounts). */
      originalSubtotalInPaise,
      /** Payable subtotal after product discounts (also used as Total). */
      subtotalInPaise,
      discountInPaise,
      discountPercent,
      giftWrapInPaise,
      shippingInPaise,
      totalInPaise,
      amountToFreeShippingInPaise: 0,
    };
  }, [items, extras]);
}

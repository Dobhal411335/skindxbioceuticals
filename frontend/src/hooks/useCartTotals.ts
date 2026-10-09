"use client";

import { useMemo } from "react";

import { useAppSelector } from "@/hooks/useAppSelector";
import {
  selectAmountToFreeShipping,
  selectCartDiscount,
  selectCartGiftWrap,
  selectCartSubtotal,
} from "@/store/slices/cartSlice";

export function useCartTotals() {
  const items = useAppSelector((state) => state.cart.items);
  const extras = useAppSelector((state) => state.cart.extras);

  return useMemo(() => {
    const subtotalInPaise = selectCartSubtotal(items);
    const discountInPaise = selectCartDiscount(
      subtotalInPaise,
      extras.appliedCoupon,
    );
    const giftWrapInPaise = selectCartGiftWrap(extras.giftWrap);
    const shippingInPaise = 0;
    const totalInPaise =
      subtotalInPaise - discountInPaise + giftWrapInPaise + shippingInPaise;
    const amountToFreeShippingInPaise = selectAmountToFreeShipping(subtotalInPaise);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items,
      extras,
      itemCount,
      subtotalInPaise,
      discountInPaise,
      giftWrapInPaise,
      shippingInPaise,
      totalInPaise,
      amountToFreeShippingInPaise,
    };
  }, [items, extras]);
}

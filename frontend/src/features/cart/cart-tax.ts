import type { CartItem } from "@/types/cart";

/** Original (list) line total in paise — tax base per product GST rules. */
export function cartLineOriginalTotalInPaise(item: CartItem): number {
  const unit =
    item.originalUnitPriceInPaise != null &&
    item.originalUnitPriceInPaise > item.unitPriceInPaise
      ? item.originalUnitPriceInPaise
      : item.unitPriceInPaise;
  return unit * item.quantity;
}

/** CGST/SGST amounts from original line total (additive on top of payable). */
export function cartLineTaxInPaise(item: CartItem): {
  cgstInPaise: number;
  sgstInPaise: number;
  taxInPaise: number;
} {
  const originalLine = cartLineOriginalTotalInPaise(item);
  const cgstPercent = item.cgstPercent ?? 0;
  const sgstPercent = item.sgstPercent ?? 0;
  const cgstInPaise =
    cgstPercent > 0 ? Math.round(originalLine * (cgstPercent / 100)) : 0;
  const sgstInPaise =
    sgstPercent > 0 ? Math.round(originalLine * (sgstPercent / 100)) : 0;
  return {
    cgstInPaise,
    sgstInPaise,
    taxInPaise: cgstInPaise + sgstInPaise,
  };
}

export function selectCartCgstTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + cartLineTaxInPaise(item).cgstInPaise, 0);
}

export function selectCartSgstTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + cartLineTaxInPaise(item).sgstInPaise, 0);
}

export function selectCartTaxTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + cartLineTaxInPaise(item).taxInPaise, 0);
}

/** Weighted display percent when lines share the same rate; else 0. */
export function selectCartTaxDisplayPercent(
  items: CartItem[],
  kind: "cgst" | "sgst",
): number {
  const rates = items
    .map((item) => (kind === "cgst" ? item.cgstPercent : item.sgstPercent) ?? 0)
    .filter((rate) => rate > 0);
  if (rates.length === 0) return 0;
  const first = rates[0]!;
  return rates.every((rate) => rate === first) ? first : 0;
}

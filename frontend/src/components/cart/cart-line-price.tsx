import { formatPaiseToInr, cn } from "@/lib/utils";
import type { CartItem } from "@/types/cart";

export type CartLinePricing = {
  originalUnitInPaise: number;
  payableUnitInPaise: number;
  hasDiscount: boolean;
  discountPercent: number;
  lineOriginalInPaise: number;
  linePayableInPaise: number;
};

export function getCartLinePricing(item: CartItem): CartLinePricing {
  const payableUnitInPaise = item.unitPriceInPaise;
  const originalUnitInPaise =
    item.originalUnitPriceInPaise != null &&
    item.originalUnitPriceInPaise > item.unitPriceInPaise
      ? item.originalUnitPriceInPaise
      : item.unitPriceInPaise;
  const hasDiscount = originalUnitInPaise > payableUnitInPaise;
  const discountPercent = hasDiscount
    ? Math.round(
        ((originalUnitInPaise - payableUnitInPaise) / originalUnitInPaise) * 100,
      )
    : 0;

  return {
    originalUnitInPaise,
    payableUnitInPaise,
    hasDiscount,
    discountPercent,
    lineOriginalInPaise: originalUnitInPaise * item.quantity,
    linePayableInPaise: payableUnitInPaise * item.quantity,
  };
}

type CartLinePriceProps = {
  item: CartItem;
  /** Show line totals (× qty) instead of unit prices. */
  mode?: "unit" | "line";
  className?: string;
  compact?: boolean;
};

/**
 * Shows payable price, struck original, and discount % when a product discount applies.
 */
export function CartLinePrice({
  item,
  mode = "unit",
  className,
  compact = false,
}: CartLinePriceProps) {
  const pricing = getCartLinePricing(item);
  const payable =
    mode === "line" ? pricing.linePayableInPaise : pricing.payableUnitInPaise;
  const original =
    mode === "line" ? pricing.lineOriginalInPaise : pricing.originalUnitInPaise;

  return (
    <div className={cn("space-y-0.5", className)}>
      <p
        className={cn(
          "font-semibold",
          compact ? "text-sm" : "text-sm",
        )}
      >
        {formatPaiseToInr(payable)}
        {pricing.hasDiscount ? (
          <span className="ml-2 text-xs font-normal text-muted-foreground line-through">
            {formatPaiseToInr(original)}
          </span>
        ) : null}
      </p>
      {pricing.hasDiscount ? (
        <p className="text-[11px] font-medium text-green-700">
          {pricing.discountPercent}% off
          {item.discountCode ? ` · ${item.discountCode}` : ""}
        </p>
      ) : item.discountCode ? (
        <p className="text-[11px] font-medium text-green-700">
          {item.discountCode} applied
        </p>
      ) : null}
    </div>
  );
}

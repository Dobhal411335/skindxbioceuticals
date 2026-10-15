import { formatPaiseToInr } from "@/lib/utils";

import { CartTaxSummary } from "@/components/cart/cart-tax-summary";

type CartOrderSummaryRowsProps = {
  originalSubtotalInPaise: number;
  subtotalInPaise: number;
  discountInPaise: number;
  discountPercent: number;
  cgstInPaise: number;
  sgstInPaise: number;
  cgstPercent: number;
  sgstPercent: number;
  totalInPaise: number;
  showShipping?: boolean;
  className?: string;
};

/**
 * Shared money breakdown for cart drawer, cart page, and checkout.
 * Original (MRP) → discount savings → payable subtotal → tax → total.
 */
export function CartOrderSummaryRows({
  originalSubtotalInPaise,
  subtotalInPaise,
  discountInPaise,
  discountPercent,
  cgstInPaise,
  sgstInPaise,
  cgstPercent,
  sgstPercent,
  totalInPaise,
  showShipping = false,
  className,
}: CartOrderSummaryRowsProps) {
  const hasDiscount = discountInPaise > 0;

  return (
    <div className={className}>
      <div className="flex justify-between text-muted-foreground">
        <span>Original price</span>
        <span>{formatPaiseToInr(originalSubtotalInPaise)}</span>
      </div>

      {hasDiscount ? (
        <div className="flex justify-between text-green-600">
          <span>
            Discount
            {discountPercent > 0 ? ` (${discountPercent}% off)` : ""}
          </span>
          <span>-{formatPaiseToInr(discountInPaise)}</span>
        </div>
      ) : null}

      <div className="flex justify-between">
        <span>{hasDiscount ? "Subtotal (after discount)" : "Subtotal"}</span>
        <span className="font-medium">{formatPaiseToInr(subtotalInPaise)}</span>
      </div>

      <CartTaxSummary
        className="contents"
        cgstInPaise={cgstInPaise}
        sgstInPaise={sgstInPaise}
        cgstPercent={cgstPercent}
        sgstPercent={sgstPercent}
      />

      {showShipping ? (
        <div className="flex justify-between text-muted-foreground">
          <span>Shipping</span>
          <span>Free</span>
        </div>
      ) : null}

      <div className="flex justify-between border-t border-gray-500 pt-2 text-base font-semibold mt-2">
        <span>Total</span>
        <span>{formatPaiseToInr(totalInPaise)}</span>
      </div>
    </div>
  );
}

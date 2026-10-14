import {
  applyProductCoupon,
  discountPercentForBadge,
  type PricedUnit,
} from "@/features/products/product-pricing";
import { cn, formatInr } from "@/lib/utils";
import type { PublicProductCoupon } from "@/types/product";

type ProductPriceDisplayProps = {
  price: number;
  coupon?: PublicProductCoupon | null;
  className?: string;
  /** Sale price text size. */
  size?: "sm" | "md" | "lg";
  /** When false, omit the green -N% badge (e.g. badge already on image). */
  showBadge?: boolean;
  /** Optional precomputed pricing (avoids double apply). */
  priced?: PricedUnit;
};

const saleSizeClass = {
  sm: "text-sm font-semibold",
  md: "text-base font-bold",
  lg: "text-lg font-bold",
} as const;

export function ProductDiscountBadge({
  percent,
  className,
}: {
  percent: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-md bg-emerald-600 px-1.5 py-0.5 text-[11px] font-semibold text-white",
        className,
      )}
    >
      -{percent}%
    </span>
  );
}

/**
 * Sale price + struck original + optional green -N% badge from product coupon.
 */
export function ProductPriceDisplay({
  price,
  coupon,
  className,
  size = "lg",
  showBadge = true,
  priced: pricedProp,
}: ProductPriceDisplayProps) {
  const priced = pricedProp ?? applyProductCoupon(price, coupon ?? null);
  const percent = discountPercentForBadge(priced);

  return (
    <div className={cn("flex flex-wrap items-baseline gap-2", className)}>
      <span
        className={cn(
          saleSizeClass[size],
          priced.hasDiscount ? "text-primary" : "text-foreground",
        )}
      >
        {formatInr(priced.unitPrice)}
      </span>
      {priced.hasDiscount ? (
        <span className="text-sm text-muted-foreground line-through">
          {formatInr(priced.originalPrice)}
        </span>
      ) : null}
      {showBadge && percent != null ? (
        <ProductDiscountBadge percent={percent} />
      ) : null}
    </div>
  );
}

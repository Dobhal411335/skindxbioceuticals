import {
  discountPercentForBadge,
  priceProductForRole,
  type PricedUnit,
} from "@/features/products/product-pricing";
import { cn, formatInr } from "@/lib/utils";
import type { PublicProductCoupon } from "@/types/product";

type ProductPriceDisplayProps = {
  price: number;
  /** Partner price when the viewer is a vendor (or dual PDP mode). */
  vendorPrice?: number | null;
  /** When true, treat `vendorPrice` as the payable partner price (no coupons). */
  isVendor?: boolean;
  /**
   * PDP-only: show labeled B2B + B2C rows when both prices exist.
   * Cards/lists keep a single payable price.
   */
  dualLabeled?: boolean;
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
        "rounded border border-primary bg-emerald-600 px-1.5 py-1 text-xs font-semibold text-white",
        className,
      )}
    >
      -{percent}%
    </span>
  );
}

/**
 * Sale price + struck original + optional green -N% badge from product coupon.
 * Vendors: payable partner price only on cards; optional B2B/B2C rows on PDP.
 */
export function ProductPriceDisplay({
  price,
  vendorPrice,
  isVendor = false,
  dualLabeled = false,
  coupon,
  className,
  size = "lg",
  showBadge = true,
  priced: pricedProp,
}: ProductPriceDisplayProps) {
  const hasVendorPrice =
    vendorPrice != null && Number.isFinite(vendorPrice) && vendorPrice >= 0;
  const priced =
    pricedProp ??
    priceProductForRole({
      price,
      vendorPrice,
      isVendor,
      coupon,
    });
  const percent = discountPercentForBadge(priced);

  if (dualLabeled && isVendor && hasVendorPrice) {
    return (
      <div className={cn("flex w-full flex-col gap-1.5 text-left", className)}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#c4820f]">
            B2B
          </span>
          <span className={cn(saleSizeClass[size], "text-primary")}>
            {formatInr(vendorPrice)}
          </span>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            B2C
          </span>
          <span className="text-sm text-muted-foreground">{formatInr(price)}</span>
        </div>
      </div>
    );
  }

  if (isVendor && hasVendorPrice) {
    return (
      <div className={cn("flex flex-wrap items-center justify-center gap-2", className)}>
        <span className={cn(saleSizeClass[size], "text-primary")}>
          {formatInr(vendorPrice)}
        </span>
        <span className="rounded border border-border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          B2B
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-start justify-start gap-2", className)}>
      <span
        className={cn(
          saleSizeClass[size],
          priced.hasDiscount ? "text-primary text-xl" : "text-foreground text-base",
        )}
      >
        {formatInr(priced.unitPrice)}
      </span>
      {priced.hasDiscount ? (
        <span className="text-sm text-muted-foreground mt-0.5 line-through">
          {formatInr(priced.originalPrice)}
        </span>
      ) : null}
      {showBadge && percent != null ? (
        <ProductDiscountBadge percent={percent} />
      ) : null}
    </div>
  );
}

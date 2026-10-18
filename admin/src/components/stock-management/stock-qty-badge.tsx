import { cn } from "cn";

/**
 * Qty badge colors:
 * - qty > 10 → green
 * - 5 < qty ≤ 10 → yellow
 * - qty ≤ 5 → red
 */
export function stockQtyBadgeClass(qty: number): string {
  if (qty > 10) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (qty > 5) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  return "border-red-200 bg-red-50 text-red-800";
}

export function StockQtyBadge({
  qty,
  label,
  className,
}: {
  qty: number;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-sm border px-2 py-2 text-sm font-medium tabular-nums",
        stockQtyBadgeClass(qty),
        className,
      )}
    >
      {label ? (
        <span className="truncate font-normal opacity-90">{label}</span>
      ) : null}
      <span className="shrink-0">{qty} items</span>
    </span>
  );
}

export function variantQtyLabel(
  sizeLabel: string | null,
  colorLabel: string | null,
  fallbackName: string,
): string {
  const parts = [sizeLabel, colorLabel].filter(Boolean);
  if (parts.length > 0) return parts.join(" / ");
  return fallbackName;
}

import { formatPaiseToInr } from "@/lib/utils";

type CartTaxSummaryProps = {
  cgstInPaise: number;
  sgstInPaise: number;
  cgstPercent: number;
  sgstPercent: number;
  className?: string;
};

function taxLabel(kind: "CGST" | "SGST", percent: number) {
  return percent > 0 ? `${kind} (${percent}%)` : kind;
}

/** Shared CGST/SGST rows for cart drawer, cart page, and checkout. */
export function CartTaxSummary({
  cgstInPaise,
  sgstInPaise,
  cgstPercent,
  sgstPercent,
  className,
}: CartTaxSummaryProps) {
  if (cgstInPaise <= 0 && sgstInPaise <= 0) return null;

  const rows = (
    <>
      {cgstInPaise > 0 ? (
        <div className="flex justify-between text-muted-foreground">
          <span>{taxLabel("CGST", cgstPercent)}</span>
          <span>{formatPaiseToInr(cgstInPaise)}</span>
        </div>
      ) : null}
      {sgstInPaise > 0 ? (
        <div className="flex justify-between text-muted-foreground">
          <span>{taxLabel("SGST", sgstPercent)}</span>
          <span>{formatPaiseToInr(sgstInPaise)}</span>
        </div>
      ) : null}
    </>
  );

  // `contents` lets rows participate in the parent summary stack.
  if (className === "contents") {
    return <div className="contents ">{rows}</div>;
  }

  return <div className={className}>{rows}</div>;
}

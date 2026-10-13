import { CheckCircle2, Info } from "lucide-react";

import type { PublicProductHighlight } from "@/types/product";

type ProductHighlightsProps = {
  highlights: PublicProductHighlight[];
};

function splitHighlight(text: string) {
  const separator = text.indexOf(":");
  if (separator <= 0 || separator >= text.length - 1) {
    return { label: null, body: text.trim() };
  }
  return {
    label: text.slice(0, separator).trim(),
    body: text.slice(separator + 1).trim(),
  };
}

export function ProductHighlights({ highlights }: ProductHighlightsProps) {
  if (highlights.length === 0) return null;

  return (
    <section className="container-page pb-10">
      <div className="rounded-lg border border-border bg-background p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Info className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="text-base font-semibold tracking-tight">
            Product Highlights
          </h2>
        </div>

        <ul>
          {highlights.map((item, index) => {
            const { label, body } = splitHighlight(item.text);
            return (
              <li
                key={item.id}
                className={
                  index < highlights.length - 1
                    ? "border-b border-border py-4 first:pt-0"
                    : "py-4 first:pt-0 last:pb-0"
                }
              >
                <div className="flex gap-3">
                  <CheckCircle2
                    className="mt-0.5 size-5 shrink-0 text-emerald-600"
                    aria-hidden
                  />
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {label ? (
                      <>
                        <span className="font-semibold text-foreground">
                          {label}:
                        </span>{" "}
                        {body}
                      </>
                    ) : (
                      body
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

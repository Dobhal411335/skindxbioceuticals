"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn, formatInr } from "@/lib/utils";
import type {
  CatalogAvailability,
  PublicProductFacetCategory,
} from "@/types/product";

/** Ensure the price slider always has at least this much headroom on the max end. */
export const PRICE_FILTER_MAX_FLOOR = 1000;

type ShopFiltersSidebarProps = {
  categories: PublicProductFacetCategory[];
  selectedCategorySlug: string | null;
  onCategoryChange: (slug: string | null) => void;
  priceBounds: { min: number; max: number };
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  availability: CatalogAvailability | null;
  onAvailabilityChange: (value: CatalogAvailability | null) => void;
  className?: string;
};

function clampRange(
  range: [number, number],
  min: number,
  max: number,
): [number, number] {
  if (max <= min) {
    return [min, min + 1];
  }
  let low = Math.min(Math.max(range[0], min), max);
  let high = Math.min(Math.max(range[1], min), max);
  if (low > high) {
    return [min, max];
  }
  if (low === high) {
    if (high < max) high = Math.min(max, low + 1);
    else low = Math.max(min, high - 1);
  }
  return [low, high];
}

export function ShopFiltersSidebar({
  categories,
  selectedCategorySlug,
  onCategoryChange,
  priceBounds,
  priceRange,
  onPriceRangeChange,
  availability,
  onAvailabilityChange,
  className,
}: ShopFiltersSidebarProps) {
  const sliderMin = Math.max(0, Math.floor(priceBounds.min));
  const sliderMax = Math.max(Math.ceil(priceBounds.max), sliderMin + 1);
  const safeRange = clampRange(priceRange, sliderMin, sliderMax);

  function toggleAvailability(value: CatalogAvailability) {
    onAvailabilityChange(availability === value ? null : value);
  }

  function updateRange(next: [number, number]) {
    onPriceRangeChange(clampRange(next, sliderMin, sliderMax));
  }

  return (
    <aside className={cn("w-full", className)}>
      <Accordion
        type="multiple"
        defaultValue={["categories", "price", "availability"]}
        className="w-full"
      >
        <AccordionItem value="categories" className="py-5">
          <AccordionTrigger className="py-0 text-sm font-semibold">
            Product Categories
          </AccordionTrigger>
          <AccordionContent className="pt-3">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No categories published yet.
              </p>
            ) : (
              <ul className="max-h-64 space-y-1 overflow-y-auto pr-1">
                {categories.map((category) => {
                  const selected = selectedCategorySlug === category.slug;
                  return (
                    <li key={category.id}>
                      <button
                        type="button"
                        onClick={() =>
                          onCategoryChange(selected ? null : category.slug)
                        }
                        className={cn(
                          "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                          "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          selected
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-muted-foreground",
                        )}
                      >
                        <span className="truncate">{category.name}</span>
                        <span className="shrink-0 tabular-nums">
                          ({category.productCount})
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="price" className="py-5">
          <AccordionTrigger className="py-0 text-sm font-semibold">
            Price
          </AccordionTrigger>
          <AccordionContent className="pt-3">
            <div className="space-y-4 px-1">
              <Slider
                min={sliderMin}
                max={sliderMax}
                step={1}
                value={safeRange}
                onValueChange={(next) => {
                  if (!Array.isArray(next) || next.length < 2) return;
                  updateRange([Number(next[0]), Number(next[1])]);
                }}
                aria-label="Price range"
              />
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="price-min" className="text-xs">
                    Min
                  </Label>
                  <Input
                    id="price-min"
                    type="number"
                    inputMode="numeric"
                    min={sliderMin}
                    max={safeRange[1]}
                    value={safeRange[0]}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      if (!Number.isFinite(next)) return;
                      updateRange([next, safeRange[1]]);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="price-max" className="text-xs">
                    Max
                  </Label>
                  <Input
                    id="price-max"
                    type="number"
                    inputMode="numeric"
                    min={safeRange[0]}
                    max={sliderMax}
                    value={safeRange[1]}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      if (!Number.isFinite(next)) return;
                      updateRange([safeRange[0], next]);
                    }}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatInr(safeRange[0])} – {formatInr(safeRange[1])}
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="availability" className="py-5">
          <AccordionTrigger className="py-0 text-sm font-semibold">
            Availability
          </AccordionTrigger>
          <AccordionContent className="pt-3">
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={availability === "in_stock"}
                  onCheckedChange={() => toggleAvailability("in_stock")}
                />
                <span>In Stock</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={availability === "out_of_stock"}
                  onCheckedChange={() => toggleAvailability("out_of_stock")}
                />
                <span>Out of Stock</span>
              </label>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </aside>
  );
}

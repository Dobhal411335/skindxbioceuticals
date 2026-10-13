"use client";

import {
  LayoutGrid,
  LayoutList,
  Grid2x2,
  Grid3x3,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { CatalogSort, CatalogViewMode } from "@/types/product";

type ShopToolbarProps = {
  viewMode: CatalogViewMode;
  onViewModeChange: (mode: CatalogViewMode) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  sort: CatalogSort;
  onSortChange: (sort: CatalogSort) => void;
  showingFrom: number;
  showingTo: number;
  total: number;
};

const VIEW_OPTIONS: Array<{
  mode: CatalogViewMode;
  label: string;
  Icon: typeof LayoutList;
}> = [
  { mode: "list", label: "List view", Icon: LayoutList },
  { mode: 2, label: "2 columns", Icon: Grid2x2 },
  { mode: 3, label: "3 columns", Icon: LayoutGrid },
  { mode: 4, label: "4 columns", Icon: Grid3x3 },
];

export function ShopToolbar({
  viewMode,
  onViewModeChange,
  searchValue,
  onSearchChange,
  sort,
  onSortChange,
  showingFrom,
  showingTo,
  total,
}: ShopToolbarProps) {
  return (
    <div className="space-y-3 border-b border-border pb-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-1">
          {VIEW_OPTIONS.map(({ mode, label, Icon }) => (
            <Button
              key={String(mode)}
              type="button"
              size="icon"
              variant={viewMode === mode ? "default" : "outline"}
              aria-label={label}
              aria-pressed={viewMode === mode}
              onClick={() => onViewModeChange(mode)}
              className={cn(
                "size-9",
                viewMode === mode && "bg-primary text-primary-foreground",
              )}
            >
              <Icon className="size-4" />
            </Button>
          ))}
        </div>

        <div className="relative w-full max-w-sm lg:mx-4 lg:flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search products"
            aria-label="Search products"
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="shrink-0 text-sm text-muted-foreground">Sort by:</span>
          <Select
            value={sort}
            onValueChange={(value) => onSortChange(value as CatalogSort)}
          >
            <SelectTrigger className="w-[180px]" aria-label="Sort products">
              <SelectValue placeholder="Default" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="rating">Avg rating</SelectItem>
              <SelectItem value="price_asc">Price: low to high</SelectItem>
              <SelectItem value="price_desc">Price: high to low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {total === 0
          ? "0 Products"
          : `${showingFrom}-${showingTo} Products of ${total} Products`}
      </p>
    </div>
  );
}

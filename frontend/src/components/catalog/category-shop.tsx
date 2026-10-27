"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

import { CategoryCarousel } from "@/components/catalog/category-carousel";
import { CatalogProductCard } from "@/components/catalog/catalog-product-card";
import { CatalogProductSkeleton } from "@/components/catalog/catalog-product-skeleton";
import {
  PRICE_FILTER_MAX_FLOOR,
  ShopFiltersSidebar,
} from "@/components/catalog/shop-filters-sidebar";
import { ShopToolbar } from "@/components/catalog/shop-toolbar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { fetchCatalogProducts } from "@/features/products/product.service";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useIsVendor } from "@/hooks/useIsVendor";
import { cn } from "@/lib/utils";
import type {
  CatalogAvailability,
  CatalogSort,
  CatalogViewMode,
  PublicProductCard,
  PublicProductFacets,
  PublicProductListMeta,
} from "@/types/product";

const INITIAL_LIMIT = 16;

type CategoryShopProps = {
  facets: PublicProductFacets;
};

function parseSort(value: string | null): CatalogSort {
  if (
    value === "rating" ||
    value === "price_asc" ||
    value === "price_desc" ||
    value === "default"
  ) {
    return value;
  }
  return "default";
}

function parseAvailability(value: string | null): CatalogAvailability | null {
  if (value === "in_stock" || value === "out_of_stock") return value;
  return null;
}

function nextPageLimit(viewMode: CatalogViewMode): number {
  return viewMode === "list" ? 4 : 8;
}

function skeletonCount(viewMode: CatalogViewMode): number {
  return viewMode === "list" ? 4 : viewMode;
}

export function CategoryShop({ facets }: CategoryShopProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isVendor = useIsVendor();

  const priceBounds = useMemo(() => {
    const min = Math.max(0, Math.floor(facets.price.min || 0));
    const facetMax = Math.ceil(facets.price.max || 0);
    // Keep a usable slider span: real catalog max, or at least ₹1000 headroom.
    const max = Math.max(facetMax, PRICE_FILTER_MAX_FLOOR, min + 1);
    return { min, max };
  }, [facets.price.min, facets.price.max]);

  const [viewMode, setViewMode] = useState<CatalogViewMode>(3);
  const [searchInput, setSearchInput] = useState(
    () => searchParams.get("q") ?? "",
  );
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  // Keep in sync when arriving from header search (`/category?q=…`).
  useEffect(() => {
    const next = searchParams.get("q") ?? "";
    setSearchInput((current) => (current === next ? current : next));
  }, [searchParams]);
  const [categorySlug, setCategorySlug] = useState<string | null>(
    () => searchParams.get("category") ?? null,
  );
  const [priceRange, setPriceRange] = useState<[number, number]>(() => {
    const minRaw = searchParams.get("priceMin");
    const maxRaw = searchParams.get("priceMax");
    const minParam = minRaw != null ? Number(minRaw) : NaN;
    const maxParam = maxRaw != null ? Number(maxRaw) : NaN;
    const low = Number.isFinite(minParam) ? minParam : priceBounds.min;
    const high = Number.isFinite(maxParam) ? maxParam : priceBounds.max;
    return [
      Math.min(Math.max(low, priceBounds.min), priceBounds.max),
      Math.min(Math.max(high, priceBounds.min), priceBounds.max),
    ];
  });
  const [debouncedPriceRange, setDebouncedPriceRange] =
    useState<[number, number]>(priceRange);
  const [availability, setAvailability] = useState<CatalogAvailability | null>(
    () => parseAvailability(searchParams.get("availability")),
  );
  const [sort, setSort] = useState<CatalogSort>(() =>
    parseSort(searchParams.get("sort")),
  );

  const [products, setProducts] = useState<PublicProductCard[]>([]);
  const [meta, setMeta] = useState<PublicProductListMeta>({
    page: 1,
    limit: INITIAL_LIMIT,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setPriceRange((current) => {
      const next: [number, number] = [
        Math.min(Math.max(current[0], priceBounds.min), priceBounds.max),
        Math.min(Math.max(current[1], priceBounds.min), priceBounds.max),
      ];
      if (next[0] > next[1]) return [priceBounds.min, priceBounds.max];
      if (next[0] === current[0] && next[1] === current[1]) return current;
      return next;
    });
  }, [priceBounds.min, priceBounds.max]);

  const loadedCountRef = useRef(0);
  const fetchingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hasMoreRef = useRef(true);
  const fetchGenerationRef = useRef(0);
  const viewModeRef = useRef(viewMode);

  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  const priceFilterActive =
    debouncedPriceRange[0] > priceBounds.min ||
    debouncedPriceRange[1] < priceBounds.max;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedPriceRange(priceRange);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [priceRange]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());
    if (categorySlug) params.set("category", categorySlug);
    if (availability) params.set("availability", availability);
    if (sort !== "default") params.set("sort", sort);
    if (priceFilterActive) {
      params.set("priceMin", String(debouncedPriceRange[0]));
      params.set("priceMax", String(debouncedPriceRange[1]));
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [
    availability,
    categorySlug,
    debouncedPriceRange,
    debouncedSearch,
    pathname,
    priceFilterActive,
    router,
    sort,
  ]);

  const loadPage = useCallback(
    async (append: boolean) => {
      if (fetchingRef.current && append) return;

      const generation = append
        ? fetchGenerationRef.current
        : ++fetchGenerationRef.current;
      const limit = append
        ? nextPageLimit(viewModeRef.current)
        : INITIAL_LIMIT;
      const offset = append ? loadedCountRef.current : 0;

      fetchingRef.current = true;
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        loadedCountRef.current = 0;
        hasMoreRef.current = true;
      }

      try {
        const result = await fetchCatalogProducts({
          q: debouncedSearch.trim() || undefined,
          categorySlug: categorySlug || undefined,
          priceMin: priceFilterActive ? debouncedPriceRange[0] : undefined,
          priceMax: priceFilterActive ? debouncedPriceRange[1] : undefined,
          availability: availability || undefined,
          sort,
          offset,
          limit,
        });

        if (generation !== fetchGenerationRef.current) {
          return;
        }

        setMeta(result.meta);
        setProducts((current) => {
          const merged = append
            ? (() => {
                const seen = new Set(current.map((item) => item.id));
                const unique = result.items.filter((item) => {
                  if (seen.has(item.id)) return false;
                  seen.add(item.id);
                  return true;
                });
                return [...current, ...unique];
              })()
            : result.items;
          loadedCountRef.current = merged.length;
          hasMoreRef.current =
            result.items.length > 0 && merged.length < result.meta.total;
          return merged;
        });
      } finally {
        if (generation === fetchGenerationRef.current) {
          setLoading(false);
          setLoadingMore(false);
          fetchingRef.current = false;
        }
      }
    },
    [
      availability,
      categorySlug,
      debouncedPriceRange,
      debouncedSearch,
      priceFilterActive,
      sort,
      isVendor,
    ],
  );

  useEffect(() => {
    void loadPage(false);
  }, [loadPage]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (fetchingRef.current) return;
        if (!hasMoreRef.current) return;
        void loadPage(true);
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadPage, products.length]);

  const showingFrom = products.length === 0 ? 0 : 1;
  const showingTo = products.length;

  const filters = (
    <ShopFiltersSidebar
      categories={facets.categories}
      selectedCategorySlug={categorySlug}
      onCategoryChange={setCategorySlug}
      priceBounds={priceBounds}
      priceRange={priceRange}
      onPriceRangeChange={setPriceRange}
      availability={availability}
      onAvailabilityChange={setAvailability}
    />
  );

  return (
    <div className="space-y-8">
      <CategoryCarousel
        categories={facets.categories}
      />

      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="hidden lg:block">{filters}</div>

        <div className="min-w-0 space-y-5">
          <div className="flex items-center justify-between gap-3 lg:hidden">
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button type="button" variant="outline" className="gap-2">
                  <SlidersHorizontal className="size-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(100%,320px)] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-4">{filters}</div>
              </SheetContent>
            </Sheet>
          </div>

          <ShopToolbar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            sort={sort}
            onSortChange={setSort}
            showingFrom={showingFrom}
            showingTo={showingTo}
            total={meta.total}
          />

          {loading ? (
            <CatalogProductSkeleton viewMode={viewMode} count={8} />
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface/60 px-6 py-16 text-center">
              <p className="font-display text-xl text-foreground">
                No products found
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try adjusting filters or search keywords.
              </p>
            </div>
          ) : (
            <div
              className={cn(
                viewMode === "list"
                  ? "space-y-4"
                  : "grid gap-4 sm:gap-5",
                viewMode === 2 && "grid-cols-1 sm:grid-cols-2",
                viewMode === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
                viewMode === 4 &&
                  "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
              )}
            >
              {products.map((product) => (
                <CatalogProductCard
                  key={product.id}
                  product={product}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}

          {loadingMore ? (
            <CatalogProductSkeleton
              viewMode={viewMode}
              count={skeletonCount(viewMode)}
            />
          ) : null}

          <div ref={sentinelRef} className="h-4 w-full" aria-hidden />
        </div>
      </div>
    </div>
  );
}

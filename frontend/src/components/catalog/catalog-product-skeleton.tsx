import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { CatalogViewMode } from "@/types/product";

type CatalogProductSkeletonProps = {
  viewMode: CatalogViewMode;
  count: number;
};

function GridSkeletonCard() {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-3">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <Skeleton className="mt-3 h-3 w-20" />
      <Skeleton className="mt-2 h-5 w-4/5" />
      <Skeleton className="mt-2 h-4 w-28" />
      <Skeleton className="mt-2 h-5 w-24" />
      <Skeleton className="mt-4 h-10 w-full rounded-full" />
    </div>
  );
}

function ListSkeletonCard() {
  return (
    <div className="flex gap-4 rounded-xl border border-border bg-card p-4">
      <Skeleton className="size-28 shrink-0 rounded-lg sm:size-36" />
      <div className="min-w-0 flex-1 space-y-2 py-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="hidden w-40 shrink-0 flex-col justify-center gap-3 border-l border-border pl-4 sm:flex">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-10 w-full rounded-full" />
      </div>
    </div>
  );
}

export function CatalogProductSkeleton({
  viewMode,
  count,
}: CatalogProductSkeletonProps) {
  if (viewMode === "list") {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        {Array.from({ length: count }, (_, index) => (
          <ListSkeletonCard key={index} />
        ))}
        <span className="sr-only">Loading more products</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-4 sm:gap-5",
        viewMode === 2 && "grid-cols-1 sm:grid-cols-2",
        viewMode === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        viewMode === 4 &&
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      )}
      aria-busy="true"
      aria-live="polite"
    >
      {Array.from({ length: count }, (_, index) => (
        <GridSkeletonCard key={index} />
      ))}
      <span className="sr-only">Loading more products</span>
    </div>
  );
}

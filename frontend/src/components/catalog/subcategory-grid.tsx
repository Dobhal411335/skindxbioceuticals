import Image from "next/image";
import Link from "next/link";

import type { PublicSubcategory } from "@/types/catalog";

type SubcategoryGridProps = {
  mainSlug: string;
  mainName: string;
  subcategories: PublicSubcategory[];
};

export function SubcategoryGrid({
  mainSlug,
  mainName,
  subcategories,
}: SubcategoryGridProps) {
  if (subcategories.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface/60 px-6 py-14 text-center">
        <p className="font-display text-xl text-foreground">No subcategories yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Subcategories for {mainName} will appear here once they are published.
        </p>
        <Link
          href="/category"
          className="mt-6 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Back to all categories
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
      {subcategories.map((subcategory) => (
        <Link
          key={subcategory.id}
          href={`/category/${encodeURIComponent(mainSlug)}/${encodeURIComponent(subcategory.slug)}`}
          className="group overflow-hidden rounded-xl border border-border bg-card transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="relative aspect-[16/9] bg-surface">
            {subcategory.bannerUrl ? (
              <Image
                src={subcategory.bannerUrl}
                alt=""
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-surface to-muted">
                <span className="px-3 text-center text-sm font-medium text-muted-foreground">
                  {subcategory.name}
                </span>
              </div>
            )}
          </div>
          <div className="px-4 py-3">
            <h2 className="line-clamp-2 text-base font-semibold tracking-tight text-foreground group-hover:text-primary">
              {subcategory.name}
            </h2>
            <p className="mt-1 text-xs text-semibold">
              {subcategory.products.length}{" "}
              {subcategory.products.length === 1 ? "product" : "products"}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

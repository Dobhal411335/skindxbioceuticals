import Link from "next/link";

import type { PublicCategory } from "@/types/catalog";

type CategoryGridProps = {
  categories: PublicCategory[];
};

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface/60 px-6 py-16 text-center">
        <p className="font-display text-xl text-foreground">Categories coming soon</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Product categories will appear here once they are published for this storefront.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/category/${encodeURIComponent(category.slug)}`}
          className="group overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-primary/10 via-surface to-muted">
            <span className="px-3 text-center text-sm font-medium text-muted-foreground">
              {category.name}
            </span>
          </div>
          <div className="px-4 py-3">
            <h2 className="font-display text-base font-semibold tracking-tight text-foreground group-hover:text-primary">
              {category.name}
            </h2>
          </div>
        </Link>
      ))}
    </div>
  );
}

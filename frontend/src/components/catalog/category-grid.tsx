import Image from "next/image";
import Link from "next/link";

import type { PublicCategory } from "@/types/catalog";

export type CategoryGridItem = PublicCategory & {
  imageUrl?: string | null;
  productCount?: number;
};

type CategoryGridProps = {
  categories: CategoryGridItem[];
};

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (categories.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/category/${encodeURIComponent(category.slug)}`}
          className="group overflow-hidden rounded-2xl border border-border bg-card transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="relative aspect-5/5 bg-surface">
            {category.imageUrl ? (
              <Image
                src={category.imageUrl}
                alt=""
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-surface to-muted">
                <span className="px-3 text-center text-sm font-bold">
                  {category.name}
                </span>
              </div>
            )}
          </div>
          <div className="px-4 py-3">
            <h2 className="font-bold text-base tracking-tight text-foreground group-hover:text-primary">
              {category.name}
            </h2>
            {typeof category.productCount === "number" ? (
              <p className="mt-1 text-xs text-semibold">
                {category.productCount}{" "}
                {category.productCount === 1 ? "product" : "products"}
              </p>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
}

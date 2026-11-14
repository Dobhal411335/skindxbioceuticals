import Image from "next/image";
import Link from "next/link";

import { hasVisibleHtmlContent } from "@/lib/rich-html";
import type { PublicCategory } from "@/types/catalog";

export type CategoryGridItem = PublicCategory & {
  imageUrl?: string | null;
  productCount?: number;
  subcategoryCount?: number;
};

type CategoryGridProps = {
  categories: CategoryGridItem[];
};

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (categories.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
      {categories.map((category) => {
        const count =
          typeof category.subcategoryCount === "number"
            ? category.subcategoryCount
            : category.productCount;
        const countLabel =
          typeof category.subcategoryCount === "number"
            ? category.subcategoryCount === 1
              ? "category"
              : "categories"
            : typeof category.productCount === "number"
              ? category.productCount === 1
                ? "product"
                : "products"
              : null;
        const showDescription = hasVisibleHtmlContent(category.description);

        return (
          <Link
            key={category.id}
            href={`/category/${encodeURIComponent(category.slug)}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="relative aspect-[6/4] overflow-hidden bg-surface">
              {category.imageUrl ? (
                <Image
                  src={category.imageUrl}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-surface to-muted">
                  <span className="px-3 text-center text-sm font-bold">
                    {category.name}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2 px-4 py-4">
              <h2 className="text-base font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                {category.name}
              </h2>
              {showDescription ? (
                <div
                  className="rich-html line-clamp-4 text-sm leading-relaxed text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: category.description ?? "" }}
                />
              ) : null}
              {typeof count === "number" && countLabel ? (
                <p className="mt-auto pt-2 px-1 text-sm font-bold text-black">
                  {count} {countLabel}
                </p>
              ) : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

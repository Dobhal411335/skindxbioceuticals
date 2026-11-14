import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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

function countMeta(category: CategoryGridItem): {
  count: number;
  label: string;
} | null {
  if (typeof category.subcategoryCount === "number") {
    return {
      count: category.subcategoryCount,
      label: category.subcategoryCount === 1 ? "category" : "categories",
    };
  }
  if (typeof category.productCount === "number") {
    return {
      count: category.productCount,
      label: category.productCount === 1 ? "product" : "products",
    };
  }
  return null;
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface/60 px-6 py-14 text-center">
        <p className="font-display text-xl text-foreground">No categories yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Published categories will appear here.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4 sm:gap-5">
      {categories.map((category) => {
        const meta = countMeta(category);
        const showDescription = hasVisibleHtmlContent(category.description);
        const href = `/category/${encodeURIComponent(category.slug)}`;

        return (
          <li key={category.id}>
            <Link
              href={href}
              className="group grid overflow-hidden rounded-2xl border border-border bg-card duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[minmax(10rem,38%)_minmax(0,1fr)]"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-surface sm:aspect-auto sm:min-h-[11.5rem]">
                {category.imageUrl ? (
                  <Image
                    src={category.imageUrl}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    sizes="(max-width: 639px) 100vw, 28vw"
                  />
                ) : (
                  <div className="flex h-full min-h-[11.5rem] items-center justify-center bg-gradient-to-br from-primary/10 via-surface to-muted">
                    <span className="px-4 text-center text-sm font-bold text-foreground">
                      {category.name}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2.5 px-5 py-5 sm:px-6 sm:py-6">
                <h2 className="text-xl leading-snug font-semibold tracking-[-0.02em] text-foreground transition-colors group-hover:text-[#ef6a24] sm:text-2xl">
                  {category.name}
                </h2>

                {meta ? (
                  <p className="text-xs font-semibold tracking-[0.14em] text-[#ef6a24] uppercase">
                    {meta.count} {meta.label}
                  </p>
                ) : null}

                {showDescription ? (
                  <div
                    className="rich-html line-clamp-3 text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]"
                    dangerouslySetInnerHTML={{
                      __html: category.description ?? "",
                    }}
                  />
                ) : null}

                <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-[#ef6a24] transition-colors group-hover:text-[#d95e1e]">
                  Explore category
                  <ArrowRight
                    className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

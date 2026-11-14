import Image from "next/image";
import Link from "next/link";

import { hasVisibleHtmlContent } from "@/lib/rich-html";
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
      {subcategories.map((subcategory) => {
        const productCount = subcategory.products.length;
        const showDescription = hasVisibleHtmlContent(subcategory.description);

        return (
          <Link
            key={subcategory.id}
            href={`/category/${encodeURIComponent(mainSlug)}/${encodeURIComponent(subcategory.slug)}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="relative aspect-[16/9] overflow-hidden bg-surface">
              {subcategory.bannerUrl ? (
                <Image
                  src={subcategory.bannerUrl}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-surface to-muted">
                  <span className="px-3 text-center text-sm font-medium text-muted-foreground">
                    {subcategory.name}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2 px-4 py-4">
              <h2 className="line-clamp-2 text-base font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                {subcategory.name}
              </h2>
              {showDescription ? (
                <div
                  className="rich-html line-clamp-4 text-sm leading-relaxed text-muted-foreground"
                  dangerouslySetInnerHTML={{
                    __html: subcategory.description ?? "",
                  }}
                />
              ) : null}
              <p className="mt-auto pt-2 px-1 text-sm font-bold text-black">
                {productCount} {productCount === 1 ? "product" : "products"}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

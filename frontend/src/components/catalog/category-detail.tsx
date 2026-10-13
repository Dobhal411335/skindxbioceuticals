import Link from "next/link";

import type { PublicCategoryDetail } from "@/types/catalog";

type CategoryDetailProps = {
  category: PublicCategoryDetail;
};

export function CategoryDetail({ category }: CategoryDetailProps) {
  const hasProducts = category.subcategories.some(
    (subcategory) => subcategory.products.length > 0,
  );

  return (
    <div className="space-y-10">
      {category.description ? (
        <p className="max-w-2xl text-sm text-muted-foreground">{category.description}</p>
      ) : null}

      {!hasProducts ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/60 px-6 py-14 text-center">
          <p className="font-display text-xl text-foreground">No products yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Products for {category.name} will show here once they are published.
          </p>
          <Link
            href="/category"
            className="mt-6 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to all categories
          </Link>
        </div>
      ) : (
        category.subcategories.map((subcategory) =>
          subcategory.products.length === 0 ? null : (
            <section key={subcategory.id} className="space-y-4">
              {subcategory.bannerUrl ? (
                <div className="overflow-hidden rounded-2xl border border-border bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary banners */}
                  <img
                    src={subcategory.bannerUrl}
                    alt=""
                    className="max-h-56 w-full object-cover"
                  />
                </div>
              ) : null}
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  {subcategory.name}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                {subcategory.products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="group rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                      {subcategory.name}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-foreground group-hover:text-primary">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {product.productCode}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ),
        )
      )}
    </div>
  );
}

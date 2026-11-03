import Link from "next/link";
import type { Metadata } from "next";

import { CategoryGrid } from "@/components/catalog/category-grid";
import { getCategories } from "@/features/catalog/catalog.service";
import { getProductFacets } from "@/features/products/product.service";

export const metadata: Metadata = {
  title: "Categories | SkinDx Bioceuticals",
  description: "Browse SkinDx Bioc product categories.",
};

export default async function CategoryIndexPage() {
  const [categories, facets] = await Promise.all([
    getCategories(),
    getProductFacets(),
  ]);

  const facetBySlug = new Map(
    facets.categories.map((item) => [item.slug, item] as const),
  );

  const gridItems = categories.map((category) => {
    const facet = facetBySlug.get(category.slug);
    return {
      ...category,
      imageUrl: category.bannerUrl || facet?.imageUrl || null,
      productCount: facet?.productCount,
    };
  });

  return (
    <div className="container-page section-space">
      <nav className="mb-4 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground hover:underline">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Categories</span>
      </nav>
      <h1 className="mt-5 max-w-2xl text-4xl leading-[0.98] font-semibold tracking-[-0.045em] text-foreground sm:text-5xl">
        Categories
      </h1>
      <div className="mt-3 h-1 w-20 rounded-full bg-gradient-to-r from-[#ef6a24] to-[#f0d8c9]" />
      <div className="mt-8">
        <CategoryGrid categories={gridItems} />
      </div>
    </div>
  );
}

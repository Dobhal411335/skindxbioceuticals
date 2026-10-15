import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";

import { CategoryShop } from "@/components/catalog/category-shop";
import { CatalogProductSkeleton } from "@/components/catalog/catalog-product-skeleton";
import { getProductFacets } from "@/features/products/product.service";

export const metadata: Metadata = {
  title: "Category | SkinDx Bioceuticals",
  description: "Browse SkinDx Bioc products by category, price, and availability.",
};

export default async function CategoryIndexPage() {
  const facets = await getProductFacets();

  return (
    <div className="container-page section-space">
      <nav className="mb-4 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground hover:underline">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground hover:underline">Category</span>
      </nav>
      <h1 className="font-display text-4xl font-semibold tracking-tight">
        Category
      </h1>
      <p className="mt-2 max-w-2xl text-base text-muted-foreground">
        Explore SkinDx Bioc products with filters for category, price, and stock.
      </p>
      <div className="mt-8">
        <Suspense
          fallback={<CatalogProductSkeleton viewMode={3} count={6} />}
        >
          <CategoryShop facets={facets} />
        </Suspense>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CategoryShop } from "@/components/catalog/category-shop";
import { CatalogProductSkeleton } from "@/components/catalog/catalog-product-skeleton";
import { getCategoryBySlugOrName } from "@/features/catalog/catalog.service";
import { getProductFacets } from "@/features/products/product.service";

type SubcategoryPageProps = {
  params: Promise<{ categoryName: string; subcategoryName: string }>;
};

export async function generateMetadata({
  params,
}: SubcategoryPageProps): Promise<Metadata> {
  const { categoryName, subcategoryName } = await params;
  const mainDecoded = decodeURIComponent(categoryName);
  const subDecoded = decodeURIComponent(subcategoryName);
  const category = await getCategoryBySlugOrName(mainDecoded);
  const subcategory = category?.subcategories.find(
    (item) =>
      item.slug === subDecoded ||
      item.name.toLowerCase() === subDecoded.toLowerCase(),
  );

  if (!category || !subcategory) {
    return { title: "Subcategory | SkinDx Bioceuticals" };
  }

  return {
    title: `${subcategory.name} | ${category.name} | SkinDx Bioceuticals`,
    description: `Shop ${subcategory.name} products in ${category.name} from SkinDx Bioc.`,
  };
}

export default async function SubcategoryProductsPage({
  params,
}: SubcategoryPageProps) {
  const { categoryName, subcategoryName } = await params;
  const mainDecoded = decodeURIComponent(categoryName);
  const subDecoded = decodeURIComponent(subcategoryName);

  const [category, facets] = await Promise.all([
    getCategoryBySlugOrName(mainDecoded),
    getProductFacets(),
  ]);

  if (!category) {
    notFound();
  }

  const subcategory = category.subcategories.find(
    (item) =>
      item.slug === subDecoded ||
      item.name.toLowerCase() === subDecoded.toLowerCase(),
  );

  if (!subcategory) {
    notFound();
  }

  return (
    <div className="container-page section-space">
      <nav className="mb-4 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/category" className="hover:text-foreground">
          Categories
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/category/${encodeURIComponent(category.slug)}`}
          className="hover:text-foreground"
        >
          {category.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{subcategory.name}</span>
      </nav>
      <h1 className="mt-5 max-w-5xl text-4xl leading-[0.98] font-semibold tracking-[-0.045em] text-foreground">
        {subcategory.name}
      </h1>
      <div className="mt-3 h-1 w-20 rounded-full bg-gradient-to-r from-[#ef6a24] to-[#f0d8c9]" />
      <div className="mt-8">
        <Suspense fallback={<CatalogProductSkeleton viewMode={3} count={6} />}>
          <CategoryShop
            facets={facets}
            lockedCategorySlug={category.slug}
            lockedSubcategorySlug={subcategory.slug}
            hideCarousel
            hideCategoryFilter
          />
        </Suspense>
      </div>
    </div>
  );
}

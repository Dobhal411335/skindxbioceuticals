import Link from "next/link";
import type { Metadata } from "next";

import { CategoryGrid } from "@/components/catalog/category-grid";
import { getCategories } from "@/features/catalog/catalog.service";

export const metadata: Metadata = {
  title: "Categories | SkinDx Bioceuticals",
  description: "Browse SkinDx Bioc product categories.",
};

export default async function CategoryIndexPage() {
  const categories = await getCategories();

  return (
    <div className="container-page section-space">
      <nav className="mb-4 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Categories</span>
      </nav>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Categories</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Explore SkinDx Bioc product families by category.
      </p>
      <div className="mt-8">
        <CategoryGrid categories={categories} />
      </div>
    </div>
  );
}

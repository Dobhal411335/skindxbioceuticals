import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SubcategoryGrid } from "@/components/catalog/subcategory-grid";
import {
  getCategories,
  getCategoryBySlugOrName,
} from "@/features/catalog/catalog.service";

type CategoryPageProps = {
  params: Promise<{ categoryName: string }>;
};

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { categoryName } = await params;
  const decoded = decodeURIComponent(categoryName);
  const category = await getCategoryBySlugOrName(decoded);

  if (!category) {
    return {
      title: "Category | SkinDx Bioceuticals",
    };
  }

  return {
    title: `${category.name} | SkinDx Bioceuticals`,
    description: category.description || `Browse ${category.name} subcategories from SkinDx Bioc.`,
  };
}

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({
    categoryName: category.slug,
  }));
}

export default async function CategoryDetailPage({ params }: CategoryPageProps) {
  const { categoryName } = await params;
  const decoded = decodeURIComponent(categoryName);
  const category = await getCategoryBySlugOrName(decoded);

  if (!category) {
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
        <span className="text-foreground">{category.name}</span>
      </nav>
      <h1 className="mt-5 max-w-5xl text-4xl leading-[0.98] font-semibold tracking-[-0.045em] text-foreground sm:text-5xl">
        {category.name}
      </h1>
      <div className="mt-3 h-1 w-20 rounded-full bg-gradient-to-r from-[#ef6a24] to-[#f0d8c9]" />
      <div className="mt-8">
        <SubcategoryGrid
          mainSlug={category.slug}
          mainName={category.name}
          subcategories={category.subcategories}
        />
      </div>
    </div>
  );
}

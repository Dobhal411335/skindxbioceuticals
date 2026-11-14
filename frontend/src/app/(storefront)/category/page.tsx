import Link from "next/link";
import type { Metadata } from "next";

import { CategoryGrid } from "@/components/catalog/category-grid";
import { getCategories } from "@/features/catalog/catalog.service";
import { getProductFacets } from "@/features/products/product.service";

const CATEGORY_TAGLINE = "Prescribing Science to Skin.";
const CATEGORY_TITLE =
  "Advanced Clinical Skincare Bioactive Formulations. Visible Results.";
const CATEGORY_SEO_PARAGRAPH =
  "Discover SkinDx Bioceuticals, where advanced pharmaceutical science meets medical-grade skincare. Formulated with potent, clinically proven actives, our targeted solutions repair, protect, and transform your skin barrier for lasting radiance.";

export const metadata: Metadata = {
  title: "Categories | SkinDx Bioceuticals",
  description: CATEGORY_SEO_PARAGRAPH,
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

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(16rem,0.92fr)_minmax(0,1.35fr)] lg:items-start lg:gap-10 xl:gap-14">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-sm font-semibold tracking-[0.18em] text-[#ef6a24] uppercase">
            {CATEGORY_TAGLINE}
          </p>
          <h1 className="mt-5 max-w-xl text-3xl leading-[1.05] font-semibold tracking-[-0.045em] text-foreground sm:text-4xl xl:text-[2.65rem] xl:leading-[1.02]">
            {CATEGORY_TITLE}
          </h1>
          <div className="mt-5 h-1 w-20 rounded-full bg-gradient-to-r from-[#ef6a24] to-[#f0d8c9]" />
          <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            {CATEGORY_SEO_PARAGRAPH}
          </p>
        </aside>

        <section
          aria-label="Product categories"
          className="min-h-0 lg:max-h-[calc(100vh-8.5rem)] lg:overflow-y-auto lg:pr-2 lg:[-ms-overflow-style:none] lg:[scrollbar-width:thin]"
        >
          <CategoryGrid categories={gridItems} />
        </section>
      </div>
    </div>
  );
}

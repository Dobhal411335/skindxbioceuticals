import Link from "next/link";
import type { Metadata } from "next";

import { ProductCard } from "@/components/landing/product-card";
import { getAllProducts } from "@/data/catalog";
import type { LandingProduct } from "@/data/landing";

export const metadata: Metadata = {
  title: "Shop | SkinDx Bioceuticals",
  description: "Browse SkinDx Bioc products.",
};

export default function ShopIndexPage() {
  const products = getAllProducts().map(
    (product): LandingProduct => ({
      id: product.id,
      name: product.name,
      category: product.category,
      pricePaise: product.priceInPaise,
      compareAtPaise: product.compareAtPriceInPaise,
      image: product.images[0]?.src ?? "",
      alt: product.images[0]?.alt ?? product.name,
      href: `/shop/${product.slug}`,
    }),
  );

  return (
    <div className="container-page section-space">
      <nav className="mb-4 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Shop</span>
      </nav>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Shop</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Static catalogue preview for the India storefront.
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

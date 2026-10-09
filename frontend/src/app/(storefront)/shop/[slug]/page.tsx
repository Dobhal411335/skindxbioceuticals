import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FrequentlyBought } from "@/components/product/frequently-bought";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductInfoTabs } from "@/components/product/product-info-tabs";
import { ProductPurchasePanel } from "@/components/product/product-purchase-panel";
import { ProductRecommendations } from "@/components/product/product-recommendations";
import { ProductStickyBar } from "@/components/product/product-sticky-bar";
import { ProductTrustSidebar } from "@/components/product/product-trust-sidebar";
import {
  getAllProductSlugs,
  getProductBySlug,
  getRecommendedProducts,
} from "@/data/catalog";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllProductSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) {
    return { title: "Product not found" };
  }
  return {
    title: `${product.name} | SkinDx Bioceuticals`,
    description: product.shortDescription,
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const recommendations = getRecommendedProducts(product.slug);

  return (
    <div className="pb-24">
      <div className="container-page section-space">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.75fr)]">
          <ProductGallery images={product.images} productName={product.name} />
          <ProductPurchasePanel product={product} />
          <ProductTrustSidebar product={product} />
        </div>
      </div>

      <ProductInfoTabs product={product} />
      <FrequentlyBought product={product} />
      <ProductRecommendations products={recommendations} />
      <ProductStickyBar product={product} />
    </div>
  );
}

"use client";

import { useState } from "react";

import { FrequentlyBought } from "@/components/product/frequently-bought";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductHighlights } from "@/components/product/product-highlights";
import { ProductInfoTabs } from "@/components/product/product-info-tabs";
import { ProductPurchasePanel } from "@/components/product/product-purchase-panel";
import { ProductRecommendations } from "@/components/product/product-recommendations";
import { ProductReviewsSection } from "@/components/product/product-reviews-section";
import { ProductStickyBar } from "@/components/product/product-sticky-bar";
import { ProductTrustSidebar } from "@/components/product/product-trust-sidebar";
import {
  defaultColor,
  defaultSize,
} from "@/features/products/product-selection";
import type { PublicProductDetail } from "@/types/product";

type ProductDetailViewProps = {
  product: PublicProductDetail;
};

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const [sizeId, setSizeId] = useState(defaultSize(product)?.id);
  const [colorId, setColorId] = useState(defaultColor(product)?.id);
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="pb-24">
      <div className="container-page section-space">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,0.7fr)]">
          <ProductGallery images={product.gallery} productName={product.name} />
          <ProductPurchasePanel
            product={product}
            sizeId={sizeId}
            colorId={colorId}
            quantity={quantity}
            onSizeChange={setSizeId}
            onColorChange={setColorId}
            onQuantityChange={setQuantity}
          />
          <ProductTrustSidebar
            product={product}
            sizeId={sizeId}
            colorId={colorId}
          />
        </div>
      </div>

      <ProductHighlights highlights={product.highlights} />
      <ProductInfoTabs product={product} />
      <FrequentlyBought product={product} />
      <ProductReviewsSection product={product} />
      <ProductRecommendations products={product.relatedProducts} />
      <ProductStickyBar
        product={product}
        sizeId={sizeId}
        colorId={colorId}
        quantity={quantity}
        onSizeChange={setSizeId}
        onColorChange={setColorId}
        onQuantityChange={setQuantity}
      />
    </div>
  );
}

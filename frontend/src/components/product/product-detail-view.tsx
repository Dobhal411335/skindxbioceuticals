"use client";

import { useEffect, useState } from "react";

import { FrequentlyBought } from "@/components/product/frequently-bought";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductHighlights } from "@/components/product/product-highlights";
import { ProductInfoTabs } from "@/components/product/product-info-tabs";
import { ProductPurchasePanel } from "@/components/product/product-purchase-panel";
import { ProductRecommendations } from "@/components/product/product-recommendations";
import { ProductReviewsSection } from "@/components/product/product-reviews-section";
import { ProductStickyBar } from "@/components/product/product-sticky-bar";
import { ProductTrustSidebar } from "@/components/product/product-trust-sidebar";
import { fetchProductBySlugClient } from "@/features/products/product.service";
import {
  defaultColor,
  defaultSize,
} from "@/features/products/product-selection";
import { useIsVendor } from "@/hooks/useIsVendor";
import type { PublicProductDetail } from "@/types/product";

type ProductDetailViewProps = {
  product: PublicProductDetail;
};

export function ProductDetailView({ product: initialProduct }: ProductDetailViewProps) {
  const isVendor = useIsVendor();
  const [product, setProduct] = useState(initialProduct);
  const [sizeId, setSizeId] = useState(defaultSize(initialProduct)?.id);
  const [colorId, setColorId] = useState(defaultColor(initialProduct)?.id);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setProduct(initialProduct);
    setSizeId(defaultSize(initialProduct)?.id);
    setColorId(defaultColor(initialProduct)?.id);
    setQuantity(1);
  }, [initialProduct]);

  // SSR payload is guest-scoped; refetch with vendor JWT for partner prices.
  useEffect(() => {
    if (!isVendor) return;
    let cancelled = false;
    void (async () => {
      const next = await fetchProductBySlugClient(initialProduct.slug);
      if (!cancelled && next) {
        setProduct(next);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isVendor, initialProduct.slug]);

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
